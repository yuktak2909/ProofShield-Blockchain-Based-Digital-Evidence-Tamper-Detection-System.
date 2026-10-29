const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const { Evidence, Case, User, CustodyLog } = require("../models");
const hashingService = require("../services/hashing.service");
const ipfsService = require("../services/ipfs.service");
const blockchainService = require("../services/blockchain.service");

exports.registerEvidence = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No evidence file was uploaded." });
  }

  const tempFilePath = req.file.path;
  let evidenceRecord = null;

  try {
    const { caseId, evidenceName, description, collectionTimestamp, location } = req.body;

    if (!caseId || !evidenceName) {
      // Remove temp file
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(400).json({ error: "Missing required fields: caseId and evidenceName are required." });
    }

    // Verify case exists
    const caseItem = await Case.findByPk(caseId);
    if (!caseItem) {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(404).json({ error: "Case not found." });
    }

    // Step 1: Generate SHA-256 hash
    console.log("Generating SHA-256 hash...");
    const fileHash = await hashingService.calculateSHA256(tempFilePath);
    console.log(`Generated SHA-256 hash: ${fileHash}`);

    // Step 2: Check duplicate hash in DB
    const duplicate = await Evidence.findOne({ where: { fileHash, status: "REGISTERED" } });
    if (duplicate) {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(400).json({ 
        error: `Duplicate Evidence Detected. This file has already been registered in Case #${duplicate.caseId} under Evidence ID: ${duplicate.id}` 
      });
    }

    // Step 3: Create initial DB record (PROCESSING state)
    evidenceRecord = await Evidence.create({
      caseId,
      evidenceName,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileHash,
      submittedBy: req.user.id,
      currentCustodian: req.user.id,
      status: "PROCESSING",
      description,
      collectionTimestamp: collectionTimestamp ? new Date(collectionTimestamp) : new Date(),
      location
    });

    // Step 4: Upload file to IPFS
    console.log("Uploading file to IPFS...");
    evidenceRecord.status = "IPFS_UPLOADED";
    await evidenceRecord.save();

    const ipfsResult = await ipfsService.uploadToIPFS(tempFilePath, fileHash);
    console.log(`Uploaded to IPFS: CID is ${ipfsResult.cid}`);
    
    evidenceRecord.ipfsCid = ipfsResult.cid;
    evidenceRecord.status = "BLOCKCHAIN_PENDING";
    await evidenceRecord.save();

    // Step 5: Register hash on Blockchain Smart Contract
    console.log("Registering hash on Ethereum blockchain...");
    const submitterWallet = req.user.walletAddress || "0x0000000000000000000000000000000000000000";
    
    const txHash = await blockchainService.registerEvidence(
      evidenceRecord.id,
      fileHash,
      caseItem.caseNumber,
      description || "No description provided",
      submitterWallet
    );
    console.log(`Blockchain transaction confirmed. Hash: ${txHash}`);

    // Step 6: Update database status to REGISTERED
    evidenceRecord.blockchainTxId = txHash;
    evidenceRecord.status = "REGISTERED";
    await evidenceRecord.save();

    // Step 7: Create initial custody log (view/creation event)
    await CustodyLog.create({
      evidenceId: evidenceRecord.id,
      actorId: req.user.id,
      action: "viewed",
      previousCustodian: req.user.id,
      newCustodian: req.user.id,
      blockchainTxId: txHash,
      timestamp: new Date()
    });

    // Clean up temporary uploaded file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log(`Cleaned up temp file: ${tempFilePath}`);
    }

    return res.status(201).json({
      message: "Evidence registered and secured on blockchain successfully.",
      evidence: evidenceRecord
    });

  } catch (error) {
    console.error("Evidence registration pipeline failed:", error);
    
    // Clean up temp file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    // Update DB record status if it was created
    if (evidenceRecord) {
      evidenceRecord.status = "REGISTRATION_FAILED";
      await evidenceRecord.save();
    }

    return res.status(500).json({ 
      error: "Evidence registration pipeline failed: " + error.message,
      evidence: evidenceRecord 
    });
  }
};

exports.getEvidence = async (req, res) => {
  try {
    const { caseId, status, fileType, search } = req.query;
    
    const where = {};
    if (caseId) where.caseId = caseId;
    if (status) where.status = status;
    if (fileType) where.fileType = { [Op.like]: `${fileType}%` };
    
    if (search) {
      where[Op.or] = [
        { id: { [Op.like]: `%${search}%` } },
        { evidenceName: { [Op.like]: `%${search}%` } },
        { fileHash: { [Op.like]: `%${search}%` } },
        { ipfsCid: { [Op.like]: `%${search}%` } }
      ];
    }

    const evidence = await Evidence.findAll({
      where,
      include: [
        { model: Case, as: "case", attributes: ["caseNumber", "title"] },
        { model: User, as: "submitter", attributes: ["name", "email"] },
        { model: User, as: "custodian", attributes: ["name", "email", "walletAddress"] }
      ],
      order: [["submitted_at", "DESC"]]
    });

    return res.status(200).json(evidence);
  } catch (error) {
    console.error("Get evidence list error:", error);
    return res.status(500).json({ error: "Failed to retrieve evidence list." });
  }
};

exports.getEvidenceById = async (req, res) => {
  try {
    const { id } = req.params;

    const evidence = await Evidence.findByPk(id, {
      include: [
        { model: Case, as: "case", attributes: ["id", "caseNumber", "title", "description"] },
        { model: User, as: "submitter", attributes: ["name", "email", "walletAddress"] },
        { model: User, as: "custodian", attributes: ["name", "email", "walletAddress"] }
      ]
    });

    if (!evidence) {
      return res.status(404).json({ error: "Evidence not found." });
    }

    return res.status(200).json(evidence);
  } catch (error) {
    console.error("Get evidence detail error:", error);
    return res.status(500).json({ error: "Failed to retrieve evidence details." });
  }
};

exports.getEvidenceBlockchainInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const evidence = await Evidence.findByPk(id);
    if (!evidence) {
      return res.status(404).json({ error: "Evidence not found in database." });
    }

    if (evidence.status !== "REGISTERED" || !evidence.blockchainTxId) {
      return res.status(400).json({ error: "Evidence is not yet registered on the blockchain." });
    }

    try {
      const chainData = await blockchainService.getEvidence(id);
      return res.status(200).json({
        database: {
          id: evidence.id,
          fileHash: evidence.fileHash,
          ipfsCid: evidence.ipfsCid,
          blockchainTxId: evidence.blockchainTxId
        },
        blockchain: chainData
      });
    } catch (chainErr) {
      return res.status(500).json({ 
        error: "Failed to query smart contract on-chain. Blockchain node may be offline.",
        details: chainErr.message 
      });
    }
  } catch (error) {
    console.error("Get blockchain record info error:", error);
    return res.status(500).json({ error: "Failed to query blockchain record details." });
  }
};

// Serves the files saved in our mock IPFS directory so the frontend can display / download them.
exports.serveMockIpfsFile = (req, res) => {
  try {
    const { cid } = req.params;
    const filePath = path.join(ipfsService.IPFS_MOCK_DIR, cid);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on IPFS gateway." });
    }

    // Set download headers or let the browser view it
    return res.sendFile(filePath);
  } catch (error) {
    console.error("Serve mock IPFS file error:", error);
    return res.status(500).json({ error: "Failed to read file from mock IPFS gateway." });
  }
};
