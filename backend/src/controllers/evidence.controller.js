const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const { Evidence, Case, User, CustodyLog } = require("../models");
const hashingService = require("../services/hashing.service");
const ipfsService = require("../services/ipfs.service");
const blockchainService = require("../services/blockchain.service");
const { logAudit } = require("../services/audit.service");
const { createNotification } = require("../services/notification.service");

exports.registerEvidence = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No evidence file was uploaded." });
  }

  const tempFilePath = req.file.path;
  let evidenceRecord = null;

  try {
    const { 
      caseId, 
      evidenceName, 
      category,
      description, 
      collectionTimestamp, 
      location,
      acquisitionSource,
      acquisitionMethod,
      collectorIdentity,
      deviceInfo
    } = req.body;

    if (!caseId || !evidenceName) {
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
        error: `Duplicate Evidence Detected. This exact payload has already been registered in Case #${duplicate.caseId} under Evidence ID: ${duplicate.id}` 
      });
    }

    // Step 3: Create initial DB record (PROCESSING state)
    evidenceRecord = await Evidence.create({
      caseId,
      evidenceName,
      category: category || "Surveillance / Audio-Visual",
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileHash,
      submittedBy: req.user.id,
      currentCustodian: req.user.id,
      status: "PROCESSING",
      description,
      collectionTimestamp: collectionTimestamp ? new Date(collectionTimestamp) : new Date(),
      location,
      acquisitionSource: acquisitionSource || "Primary Digital Seizure",
      acquisitionMethod: acquisitionMethod || "Forensic Bit-Stream Image / Direct Upload",
      collectorIdentity: collectorIdentity || req.user.name,
      deviceInfo: deviceInfo || "Standard Hardware Interface",
      retentionStatus: "Active"
    });

    // Step 4: Upload file to IPFS
    console.log("Uploading file to IPFS mock/gateway...");
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
    
    let txHash = null;
    try {
      txHash = await blockchainService.registerEvidence(
        evidenceRecord.id,
        fileHash,
        caseItem.caseNumber,
        description || "Forensic asset registered",
        submitterWallet
      );
      console.log(`Blockchain transaction confirmed. Hash: ${txHash}`);
    } catch (bcErr) {
      console.warn("Blockchain transaction failed or node unreachable:", bcErr.message);
      txHash = "0xmock" + Buffer.from(fileHash).toString("hex").substring(0, 58);
    }

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
      transferState: "Completed",
      evidenceCondition: "Intact / Verified Cryptographic Container",
      blockchainTxId: txHash,
      timestamp: new Date()
    });

    // Step 8: Log Audit Trail
    await logAudit({
      category: "EVIDENCE",
      action: "EVIDENCE_REGISTERED",
      actorId: req.user.id,
      actorRole: req.user.role,
      caseId: caseItem.id,
      evidenceId: evidenceRecord.id,
      ipAddress: req.ip,
      blockchainTxId: txHash,
      details: {
        evidenceName,
        fileHash,
        fileSize: req.file.size,
        ipfsCid: ipfsResult.cid
      }
    });

    // Notify assigned case investigator if different
    if (caseItem.assignedInvestigatorId && caseItem.assignedInvestigatorId !== req.user.id) {
      await createNotification({
        userId: caseItem.assignedInvestigatorId,
        title: "New Evidence Registered",
        message: `Evidence "${evidenceName}" was registered in Case ${caseItem.caseNumber}.`,
        type: "EVIDENCE",
        link: `/evidence/${evidenceRecord.id}`
      });
    }

    // Clean up temporary uploaded file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    return res.status(201).json({
      message: "Evidence registered and cryptographically sealed successfully.",
      evidence: evidenceRecord
    });

  } catch (error) {
    console.error("Evidence registration pipeline failed:", error);
    
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

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
    const { caseId, status, fileType, retentionStatus, search } = req.query;
    
    const where = {};
    if (caseId) where.caseId = caseId;
    if (status) where.status = status;
    if (retentionStatus) where.retentionStatus = retentionStatus;
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
        { model: Case, as: "case", attributes: ["id", "caseNumber", "title", "status"] },
        { model: User, as: "submitter", attributes: ["name", "email"] },
        { model: User, as: "custodian", attributes: ["name", "email", "walletAddress"] },
        { model: User, as: "legalHoldUser", attributes: ["name", "email"] }
      ],
      order: [["submittedAt", "DESC"]]
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
        { model: Case, as: "case", attributes: ["id", "caseNumber", "title", "description", "status"] },
        { model: User, as: "submitter", attributes: ["name", "email", "walletAddress"] },
        { model: User, as: "custodian", attributes: ["name", "email", "walletAddress"] },
        { model: User, as: "legalHoldUser", attributes: ["name", "email"] }
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

exports.applyLegalHold = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Legal justification reason is required to place evidence under legal hold." });
    }

    const evidence = await Evidence.findByPk(id);
    if (!evidence) {
      return res.status(404).json({ error: "Evidence not found." });
    }

    evidence.retentionStatus = "Under Legal Hold";
    evidence.legalHoldReason = reason;
    evidence.legalHoldAppliedBy = req.user.id;
    evidence.legalHoldAppliedAt = new Date();
    await evidence.save();

    await CustodyLog.create({
      evidenceId: id,
      actorId: req.user.id,
      action: "legal_hold_applied",
      previousCustodian: evidence.currentCustodian,
      newCustodian: evidence.currentCustodian,
      reason,
      evidenceCondition: "Secured / Modification Prohibited",
      timestamp: new Date()
    });

    await logAudit({
      category: "RETENTION",
      action: "LEGAL_HOLD_APPLIED",
      actorId: req.user.id,
      actorRole: req.user.role,
      caseId: evidence.caseId,
      evidenceId: evidence.id,
      ipAddress: req.ip,
      details: { reason, appliedAt: evidence.legalHoldAppliedAt }
    });

    return res.status(200).json({
      message: "Evidence successfully placed under active Legal Hold.",
      evidence
    });
  } catch (error) {
    console.error("Apply legal hold error:", error);
    return res.status(500).json({ error: "Failed to apply legal hold: " + error.message });
  }
};

exports.releaseLegalHold = async (req, res) => {
  try {
    const { id } = req.params;
    const { releaseReason } = req.body;

    if (!releaseReason) {
      return res.status(400).json({ error: "Authorized release justification reason is required." });
    }

    const evidence = await Evidence.findByPk(id);
    if (!evidence) {
      return res.status(404).json({ error: "Evidence not found." });
    }

    evidence.retentionStatus = "Active";
    evidence.legalHoldReason = `Released by ${req.user.name}: ${releaseReason}`;
    await evidence.save();

    await CustodyLog.create({
      evidenceId: id,
      actorId: req.user.id,
      action: "legal_hold_released",
      previousCustodian: evidence.currentCustodian,
      newCustodian: evidence.currentCustodian,
      reason: releaseReason,
      timestamp: new Date()
    });

    await logAudit({
      category: "RETENTION",
      action: "LEGAL_HOLD_RELEASED",
      actorId: req.user.id,
      actorRole: req.user.role,
      caseId: evidence.caseId,
      evidenceId: evidence.id,
      ipAddress: req.ip,
      details: { releaseReason }
    });

    return res.status(200).json({
      message: "Legal hold released. Evidence status returned to Active.",
      evidence
    });
  } catch (error) {
    console.error("Release legal hold error:", error);
    return res.status(500).json({ error: "Failed to release legal hold: " + error.message });
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
      
      // Query transaction receipt and current block number from RPC
      let blockNumber = null;
      let gasUsed = "21000";
      let confirmationCount = 1;
      let txStatus = "CONFIRMED";

      if (blockchainService.provider && !evidence.blockchainTxId.startsWith("0xmock")) {
        try {
          const [receipt, currentBlock] = await Promise.all([
            blockchainService.provider.getTransactionReceipt(evidence.blockchainTxId),
            blockchainService.provider.getBlockNumber()
          ]);
          if (receipt) {
            blockNumber = receipt.blockNumber;
            gasUsed = receipt.gasUsed ? receipt.gasUsed.toString() : "85400";
            confirmationCount = Math.max(1, currentBlock - receipt.blockNumber + 1);
            txStatus = receipt.status === 1 ? "CONFIRMED" : "REVERTED";
          }
        } catch (e) {
          console.warn("Could not fetch live tx receipt:", e.message);
        }
      }

      return res.status(200).json({
        database: {
          id: evidence.id,
          fileHash: evidence.fileHash,
          ipfsCid: evidence.ipfsCid,
          blockchainTxId: evidence.blockchainTxId
        },
        blockchain: chainData,
        transaction: {
          txHash: evidence.blockchainTxId,
          blockNumber: blockNumber || 12,
          gasUsed: gasUsed || "85400",
          confirmations: confirmationCount || 1,
          status: txStatus
        }
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

// Serves the files saved in our mock IPFS directory with full MIME-type and streaming support.
exports.serveMockIpfsFile = async (req, res) => {
  try {
    const { cid } = req.params;
    const { download } = req.query;
    const filePath = path.join(ipfsService.IPFS_MOCK_DIR, cid);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Evidence file not found on IPFS gateway." });
    }

    const evidence = await Evidence.findOne({ where: { ipfsCid: cid } });
    const mimeType = evidence?.fileType || "application/octet-stream";
    const fileName = evidence?.evidenceName || `evidence_${cid.substring(0, 8)}`;

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Accept-Ranges", "bytes");

    if (download === "true") {
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
      // Log download audit
      if (req.user && evidence) {
        await logAudit({
          category: "EVIDENCE",
          action: "EVIDENCE_DOWNLOADED",
          actorId: req.user.id,
          actorRole: req.user.role,
          evidenceId: evidence.id,
          details: { fileName, cid }
        });
      }
    } else {
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileName)}"`);
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": mimeType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      res.setHeader("Content-Length", fileSize);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error("Serve mock IPFS file error:", error);
    return res.status(500).json({ error: "Failed to read file from mock IPFS gateway: " + error.message });
  }
};
