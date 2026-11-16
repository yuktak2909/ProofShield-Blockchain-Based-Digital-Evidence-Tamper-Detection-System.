const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const { Evidence, Case, User, CustodyLog, VerificationLog } = require("../models");
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
    const duplicate = await Evidence.findOne({
      where: { fileHash, status: "REGISTERED" },
      include: [{ model: Case, as: "case", attributes: ["caseNumber", "title"] }]
    });
    if (duplicate) {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      const caseRef = duplicate.case ? `${duplicate.case.caseNumber} (${duplicate.case.title})` : `ID ${duplicate.caseId}`;
      return res.status(400).json({
        error: `Duplicate Evidence Detected. This exact bit-stream file has already been registered in ${caseRef} under Evidence ID: ${duplicate.id} (${duplicate.evidenceName}).`
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

    let txReceipt = null;
    let blockchainStatus = "NOT_ANCHORED";
    let blockchainError = null;

    try {
      await logAudit({
        category: "BLOCKCHAIN",
        action: "BLOCKCHAIN_REGISTRATION_INITIATED",
        actorId: req.user.id,
        actorRole: req.user.role,
        caseId: caseItem.id,
        evidenceId: evidenceRecord.id,
        ipAddress: req.ip,
        details: {
          evidenceName,
          fileHash,
          submitterWallet
        }
      });

      txReceipt = await blockchainService.registerEvidence(
        evidenceRecord.id,
        fileHash,
        caseItem.caseNumber,
        description || "Forensic asset registered",
        submitterWallet
      );
      blockchainStatus = "CONFIRMED";
      console.log(`Blockchain transaction confirmed. Hash: ${txReceipt.txHash}, Block: ${txReceipt.blockNumber}`);

      await logAudit({
        category: "BLOCKCHAIN",
        action: "BLOCKCHAIN_REGISTRATION_CONFIRMED",
        actorId: req.user.id,
        actorRole: req.user.role,
        caseId: caseItem.id,
        evidenceId: evidenceRecord.id,
        ipAddress: req.ip,
        blockchainTxId: txReceipt.txHash,
        details: {
          blockNumber: txReceipt.blockNumber,
          gasUsed: txReceipt.gasUsed
        }
      });
    } catch (bcErr) {
      blockchainStatus = "FAILED";
      blockchainError = bcErr.message || "Ethereum smart contract transaction failed or node unreachable";
      console.warn("Blockchain transaction failed:", blockchainError);

      await logAudit({
        category: "BLOCKCHAIN",
        action: "BLOCKCHAIN_REGISTRATION_FAILED",
        actorId: req.user.id,
        actorRole: req.user.role,
        caseId: caseItem.id,
        evidenceId: evidenceRecord.id,
        ipAddress: req.ip,
        status: "WARNING",
        details: {
          error: blockchainError,
          reason: "Ethereum node offline or smart contract revert. Exhibit retained in database for retry anchoring."
        }
      });
    }

    // Step 6: Update database status to REGISTERED
    evidenceRecord.blockchainTxId = txReceipt ? txReceipt.txHash : null;
    evidenceRecord.blockchainBlockNumber = txReceipt ? txReceipt.blockNumber : null;
    evidenceRecord.blockchainAnchoredAt = txReceipt ? new Date() : null;
    evidenceRecord.blockchainStatus = blockchainStatus;
    if (txReceipt && txReceipt.chainId) evidenceRecord.blockchainChainId = txReceipt.chainId;
    if (txReceipt && txReceipt.contractAddress) evidenceRecord.blockchainContractAddress = txReceipt.contractAddress;
    if (txReceipt && txReceipt.genesisHash) evidenceRecord.blockchainGenesisHash = txReceipt.genesisHash;
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
      blockchainTxId: txReceipt ? txReceipt.txHash : null,
      blockchainStatus: blockchainStatus,
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
      blockchainTxId: txReceipt ? txReceipt.txHash : null,
      details: {
        evidenceName,
        fileHash,
        fileSize: req.file.size,
        ipfsCid: ipfsResult.cid,
        blockchainStatus
      }
    });

    // Notify assigned case investigator if different
    if (caseItem.assignedInvestigatorId && caseItem.assignedInvestigatorId !== req.user.id) {
      await createNotification({
        userId: caseItem.assignedInvestigatorId,
        title: "New Evidence Registered",
        message: `Evidence "${evidenceName}" was registered in Case ${caseItem.caseNumber}. Blockchain Status: ${blockchainStatus}.`,
        type: "EVIDENCE",
        link: `/evidence/${evidenceRecord.id}`
      });
    }

    // Clean up temporary uploaded file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    return res.status(201).json({
      message: blockchainStatus === "CONFIRMED"
        ? "Evidence registered and cryptographically anchored to Ethereum smart contract successfully."
        : "Evidence registered in ProofShield database. Blockchain anchoring could not be confirmed (Ethereum node standby or contract error). Use the 'Anchor Exhibit' action to retry.",
      blockchainStatus,
      blockchainError,
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
    const { caseId, status, fileType, retentionStatus, custodianId, integrityStatus, search } = req.query;

    const where = {};
    if (caseId) where.caseId = caseId;
    if (status) where.status = status;
    if (retentionStatus) where.retentionStatus = retentionStatus;
    if (custodianId) where.currentCustodian = custodianId;
    if (fileType) where.fileType = { [Op.like]: `${fileType}%` };

    if (search) {
      where[Op.or] = [
        { id: { [Op.like]: `%${search}%` } },
        { evidenceName: { [Op.like]: `%${search}%` } },
        { fileHash: { [Op.like]: `%${search}%` } },
        { ipfsCid: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } }
      ];
    }

    const evidence = await Evidence.findAll({
      where,
      include: [
        { model: Case, as: "case", attributes: ["id", "caseNumber", "title", "status"] },
        { model: User, as: "submitter", attributes: ["name", "email"] },
        { model: User, as: "custodian", attributes: ["id", "name", "email", "walletAddress"] },
        { model: User, as: "legalHoldUser", attributes: ["name", "email"] },
        {
          model: VerificationLog,
          as: "verificationLogs",
          attributes: ["id", "result", "timestamp"],
          separate: true,
          order: [["timestamp", "DESC"]]
        }
      ],
      order: [["submittedAt", "DESC"]]
    });

    // Augment with integrityStatus based on genuine verification records
    const enriched = evidence.map(ev => {
      const plain = ev.toJSON();
      const logs = plain.verificationLogs || [];
      if (logs.length > 0) {
        plain.integrityStatus = logs[0].result === "verified" ? "Hash Match" : "Hash Mismatch";
        plain.lastVerifiedAt = logs[0].timestamp;
      } else {
        plain.integrityStatus = "Not Yet Verified";
        plain.lastVerifiedAt = null;
      }
      return plain;
    });

    let filtered = enriched;
    if (integrityStatus) {
      filtered = filtered.filter(item => item.integrityStatus === integrityStatus);
    }

    return res.status(200).json(filtered);
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

    const evidence = await Evidence.findByPk(id, {
      include: [
        { model: Case, as: "case", attributes: ["caseNumber", "title"] },
        { model: User, as: "submitter", attributes: ["name", "walletAddress"] },
        { model: User, as: "custodian", attributes: ["name", "walletAddress"] }
      ]
    });
    if (!evidence) {
      return res.status(404).json({ error: "Evidence not found in database." });
    }

    // Diagnostics: Accurately separate Node status, Contract status, and Record presence
    // Pass existing evidence record to detect chain reset / previous-chain state
    const onChainCheck = await blockchainService.checkEvidenceOnChainStatus(id, evidence);

    // If chain reset detected (exhibit was anchored on a previous chain instance):
    let effectiveBlockchainStatus = evidence.blockchainStatus || "NOT_ANCHORED";
    if (onChainCheck.recordStatus === "RECORD_PREVIOUS_CHAIN_UNVERIFIABLE") {
      effectiveBlockchainStatus = "PREVIOUS_CHAIN";
      // Persist the previous chain status in database without deleting historical txId/blockNumber
      if (evidence.blockchainStatus === "CONFIRMED") {
        evidence.blockchainStatus = "PREVIOUS_CHAIN";
        await evidence.save();
      }
    } else if (onChainCheck.recordStatus === "RECORD_CONFIRMED_ON_CHAIN") {
      effectiveBlockchainStatus = "CONFIRMED";
    }

    // Query live transaction receipt if an actual transaction hash is recorded
    let txReceiptData = {
      txHash: evidence.blockchainTxId || null,
      blockNumber: evidence.blockchainBlockNumber || null,
      gasUsed: null,
      confirmations: null,
      status: onChainCheck.recordStatus === "RECORD_CONFIRMED_ON_CHAIN"
        ? "CONFIRMED"
        : onChainCheck.recordStatus === "RECORD_PREVIOUS_CHAIN_UNVERIFIABLE"
          ? "PREVIOUS_CHAIN_UNVERIFIABLE"
          : onChainCheck.recordStatus === "RECORD_NOT_ANCHORED_ON_CHAIN"
            ? "NOT_ANCHORED"
            : "UNAVAILABLE",
      isGenuine: false,
      isCurrentChain: onChainCheck.recordStatus === "RECORD_CONFIRMED_ON_CHAIN"
    };

    const hasRealTxHash = evidence.blockchainTxId &&
      !evidence.blockchainTxId.startsWith("0xmock") &&
      !evidence.blockchainTxId.startsWith("0x789456") &&
      !evidence.blockchainTxId.startsWith("0x123456") &&
      !evidence.blockchainTxId.startsWith("0x998877") &&
      !evidence.blockchainTxId.startsWith("0x554433");

    if (blockchainService.provider && onChainCheck.nodeStatus === "OPERATIONAL" && hasRealTxHash) {
      try {
        const [receipt, currentBlock] = await Promise.all([
          blockchainService.provider.getTransactionReceipt(evidence.blockchainTxId),
          blockchainService.provider.getBlockNumber()
        ]);
        if (receipt) {
          txReceiptData = {
            txHash: evidence.blockchainTxId,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : null,
            confirmations: Math.max(1, currentBlock - receipt.blockNumber + 1),
            status: receipt.status === 1 ? "CONFIRMED" : "REVERTED",
            isGenuine: true,
            isCurrentChain: true
          };
        } else {
          // Receipt is not found on the currently active chain (chain reset)
          txReceiptData = {
            txHash: evidence.blockchainTxId,
            blockNumber: evidence.blockchainBlockNumber,
            gasUsed: null,
            confirmations: null,
            status: "PREVIOUS_CHAIN_UNVERIFIABLE",
            isGenuine: true,
            isCurrentChain: false,
            note: "Transaction hash recorded historically, but receipt is unavailable on currently connected Ethereum chain."
          };
        }
      } catch (e) {
        console.warn("Could not query transaction receipt:", e.message);
      }
    }

    return res.status(200).json({
      database: {
        id: evidence.id,
        evidenceName: evidence.evidenceName,
        fileHash: evidence.fileHash,
        ipfsCid: evidence.ipfsCid,
        blockchainTxId: evidence.blockchainTxId,
        blockchainStatus: effectiveBlockchainStatus,
        blockchainBlockNumber: evidence.blockchainBlockNumber,
        blockchainAnchoredAt: evidence.blockchainAnchoredAt,
        blockchainChainId: evidence.blockchainChainId,
        blockchainContractAddress: evidence.blockchainContractAddress,
        blockchainGenesisHash: evidence.blockchainGenesisHash
      },
      blockchain: onChainCheck.data || null,
      nodeStatus: onChainCheck.nodeStatus,
      contractStatus: onChainCheck.contractStatus,
      recordStatus: onChainCheck.recordStatus,
      isStaleChain: onChainCheck.isStaleChain || false,
      networkIdentity: onChainCheck.networkIdentity || null,
      errorDetails: onChainCheck.error || null,
      transaction: txReceiptData
    });
  } catch (error) {
    console.error("Get blockchain record info error:", error);
    return res.status(500).json({ error: "Failed to query blockchain record details: " + error.message });
  }
};

/**
 * Anchors an existing database evidence exhibit to the Ethereum smart contract.
 * Safe to retry, verifies physical file hash, prevents duplicates, records genuine tx details.
 */
exports.anchorEvidenceOnChain = async (req, res) => {
  try {
    const { id } = req.params;

    const evidence = await Evidence.findByPk(id, {
      include: [
        { model: Case, as: "case" },
        { model: User, as: "submitter" }
      ]
    });
    if (!evidence) {
      return res.status(404).json({ error: "Evidence exhibit not found in database." });
    }

    // Step 1: Locate physical evidence file to verify integrity before anchoring
    const possiblePaths = [
      path.join(ipfsService.IPFS_MOCK_DIR, evidence.ipfsCid || ""),
      path.join(__dirname, "../../uploads/demo_files", evidence.evidenceName || ""),
      path.join(__dirname, "../../uploads", evidence.evidenceName || "")
    ];

    let foundPath = null;
    for (const p of possiblePaths) {
      if (evidence.ipfsCid && fs.existsSync(p)) {
        foundPath = p;
        break;
      }
    }

    if (!foundPath) {
      const demoPath = path.join(__dirname, "../../uploads/demo_files", evidence.evidenceName);
      if (fs.existsSync(demoPath)) {
        foundPath = demoPath;
      }
    }

    if (!foundPath) {
      return res.status(400).json({
        error: "Physical evidence file could not be located on disk to verify cryptographic hash before on-chain anchoring."
      });
    }

    // Step 2: Recalculate SHA-256 and compare with database
    const recalculatedHash = await hashingService.calculateSHA256(foundPath);
    if (recalculatedHash.toLowerCase() !== evidence.fileHash.toLowerCase()) {
      return res.status(409).json({
        error: `Integrity Mismatch: Recalculated file hash (${recalculatedHash}) does not match registered baseline (${evidence.fileHash}). Anchoring aborted to prevent committing tampered data.`
      });
    }

    // Step 3: Check whether evidence is already anchored on-chain
    const onChainCheck = await blockchainService.checkEvidenceOnChainStatus(evidence.id);
    if (onChainCheck.nodeStatus !== "OPERATIONAL") {
      return res.status(503).json({
        error: "Ethereum JSON-RPC node is currently offline. Start the blockchain node at http://127.0.0.1:8545 to anchor evidence."
      });
    }
    if (onChainCheck.contractStatus !== "OPERATIONAL") {
      return res.status(503).json({
        error: "ProofShield smart contract is unavailable or not deployed at configured address."
      });
    }

    if (onChainCheck.recordStatus === "RECORD_CONFIRMED_ON_CHAIN") {
      evidence.blockchainStatus = "CONFIRMED";
      if (!evidence.blockchainAnchoredAt) evidence.blockchainAnchoredAt = new Date();
      await evidence.save();

      return res.status(200).json({
        message: "Evidence is already anchored on the Ethereum smart contract. Database index synchronized.",
        evidence,
        onChainData: onChainCheck.data
      });
    }

    // Step 4: Execute genuine smart contract registration
    const submitterWallet = evidence.submitter?.walletAddress || req.user?.walletAddress || "0x0000000000000000000000000000000000000000";
    const caseRef = evidence.case?.caseNumber || "CASE-FILE";
    const desc = evidence.description || "Forensic asset anchored";

    console.log(`Executing on-chain anchoring for exhibit ${evidence.id} (${evidence.evidenceName})...`);

    await logAudit({
      category: "BLOCKCHAIN",
      action: "BLOCKCHAIN_REGISTRATION_INITIATED",
      actorId: req.user.id,
      actorRole: req.user.role,
      caseId: evidence.caseId,
      evidenceId: evidence.id,
      ipAddress: req.ip,
      details: {
        action: "ON_DEMAND_ANCHORING",
        evidenceName: evidence.evidenceName,
        fileHash: evidence.fileHash
      }
    });

    const txReceipt = await blockchainService.registerEvidence(
      evidence.id,
      evidence.fileHash,
      caseRef,
      desc,
      submitterWallet
    );

    // Step 5: Save genuine transaction details
    evidence.blockchainTxId = txReceipt.txHash;
    evidence.blockchainBlockNumber = txReceipt.blockNumber;
    evidence.blockchainStatus = "CONFIRMED";
    evidence.blockchainAnchoredAt = new Date();
    if (txReceipt.chainId) evidence.blockchainChainId = txReceipt.chainId;
    if (txReceipt.contractAddress) evidence.blockchainContractAddress = txReceipt.contractAddress;
    if (txReceipt.genesisHash) evidence.blockchainGenesisHash = txReceipt.genesisHash;
    await evidence.save();

    await logAudit({
      category: "BLOCKCHAIN",
      action: "EXISTING_EVIDENCE_ANCHORED",
      actorId: req.user.id,
      actorRole: req.user.role,
      caseId: evidence.caseId,
      evidenceId: evidence.id,
      ipAddress: req.ip,
      blockchainTxId: txReceipt.txHash,
      details: {
        blockNumber: txReceipt.blockNumber,
        gasUsed: txReceipt.gasUsed,
        anchoredAt: evidence.blockchainAnchoredAt
      }
    });

    return res.status(200).json({
      message: "Evidence exhibit successfully anchored to Ethereum smart contract.",
      transaction: txReceipt,
      evidence
    });

  } catch (error) {
    console.error("Anchor evidence on-chain error:", error);
    return res.status(500).json({
      error: "Failed to anchor evidence to blockchain: " + error.message
    });
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
