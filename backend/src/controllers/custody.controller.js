const { Evidence, CustodyLog, User, Case } = require("../models");
const blockchainService = require("../services/blockchain.service");
const { logAudit } = require("../services/audit.service");
const { createNotification } = require("../services/notification.service");

exports.viewEvidence = async (req, res) => {
  try {
    const { id } = req.params;

    const evidence = await Evidence.findByPk(id);
    if (!evidence) {
      return res.status(404).json({ error: "Evidence not found." });
    }

    const log = await CustodyLog.create({
      evidenceId: id,
      actorId: req.user.id,
      action: "viewed",
      previousCustodian: evidence.currentCustodian,
      newCustodian: evidence.currentCustodian,
      transferState: "Completed",
      blockchainTxId: null,
      timestamp: new Date()
    });

    return res.status(200).json({ message: "Custody view logged.", log });
  } catch (error) {
    console.error("Log view error:", error);
    return res.status(500).json({ error: "Failed to log custody view." });
  }
};

exports.downloadEvidence = async (req, res) => {
  try {
    const { id } = req.params;

    const evidence = await Evidence.findByPk(id);
    if (!evidence) {
      return res.status(404).json({ error: "Evidence not found." });
    }

    const log = await CustodyLog.create({
      evidenceId: id,
      actorId: req.user.id,
      action: "downloaded",
      previousCustodian: evidence.currentCustodian,
      newCustodian: evidence.currentCustodian,
      transferState: "Completed",
      blockchainTxId: null,
      timestamp: new Date()
    });

    await logAudit({
      category: "EVIDENCE",
      action: "EVIDENCE_DOWNLOADED",
      actorId: req.user.id,
      actorRole: req.user.role,
      evidenceId: evidence.id,
      caseId: evidence.caseId,
      details: { evidenceName: evidence.evidenceName }
    });

    return res.status(200).json({ message: "Custody download logged.", log });
  } catch (error) {
    console.error("Log download error:", error);
    return res.status(500).json({ error: "Failed to log custody download." });
  }
};

/**
 * Step 1: Initiate a Custody Transfer (State becomes PENDING)
 * Custodian DOES NOT change until receiver accepts!
 */
exports.initiateTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { receivingUserId, reason, notes, evidenceCondition } = req.body;

    if (!receivingUserId || !reason) {
      return res.status(400).json({ error: "Receiving user and official transfer reason are required." });
    }

    const evidence = await Evidence.findByPk(id, {
      include: [{ model: Case, as: "case" }]
    });
    if (!evidence) {
      return res.status(404).json({ error: "Evidence not found." });
    }

    // Check if under legal hold
    if (evidence.retentionStatus === "Under Legal Hold") {
      return res.status(403).json({ 
        error: "Evidence is currently under an active Legal Hold. Physical and custodial transfers are restricted." 
      });
    }

    // Authorization: Only the current custodian or admin can initiate
    if (evidence.currentCustodian !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Permission denied. Only the active custodian or system administrator can initiate a custody transfer." 
      });
    }

    const receivingUser = await User.findByPk(receivingUserId);
    if (!receivingUser) {
      return res.status(404).json({ error: "Target custodian user account not found." });
    }

    if (receivingUserId === evidence.currentCustodian) {
      return res.status(400).json({ error: "Cannot transfer custody to the existing current custodian." });
    }

    // Check if there is already a pending transfer
    const existingPending = await CustodyLog.findOne({
      where: {
        evidenceId: id,
        transferState: "Pending"
      }
    });

    if (existingPending) {
      return res.status(400).json({ 
        error: "There is already a pending custody transfer awaiting acceptance on this item. Cancel or resolve it before initiating a new one." 
      });
    }

    // Create Pending Custody Record
    const log = await CustodyLog.create({
      evidenceId: id,
      actorId: req.user.id,
      action: "transfer_initiated",
      previousCustodian: evidence.currentCustodian,
      newCustodian: receivingUserId,
      transferState: "Pending",
      reason,
      notes: notes || "Standard investigative chain of custody transfer",
      evidenceCondition: evidenceCondition || "Intact / Verified Cryptographic Container",
      timestamp: new Date()
    });

    await logAudit({
      category: "CUSTODY",
      action: "CUSTODY_TRANSFER_INITIATED",
      actorId: req.user.id,
      actorRole: req.user.role,
      evidenceId: id,
      caseId: evidence.caseId,
      details: {
        fromUser: req.user.name,
        toUser: receivingUser.name,
        reason,
        evidenceCondition
      }
    });

    // Send Notification to recipient
    await createNotification({
      userId: receivingUserId,
      title: "Custody Transfer Request",
      message: `${req.user.name} initiated a custody transfer of "${evidence.evidenceName}" for your acceptance.`,
      type: "TRANSFER",
      link: `/custody?evidenceId=${id}`
    });

    return res.status(200).json({
      message: `Custody transfer initiated. Awaiting acceptance from ${receivingUser.name}.`,
      log
    });

  } catch (error) {
    console.error("Initiate custody transfer error:", error);
    return res.status(500).json({ error: "Failed to initiate custody transfer: " + error.message });
  }
};

/**
 * Step 2A: Accept Custody Transfer
 * Receiver accepts -> executes smart contract transfer -> updates currentCustodian
 */
exports.acceptTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { logId, acceptanceNotes, conditionNotes } = req.body;

    let evidence = await Evidence.findByPk(id);
    let pendingLog = null;

    if (evidence) {
      pendingLog = await CustodyLog.findOne({
        where: {
          evidenceId: id,
          ...(logId ? { id: logId } : {}),
          transferState: "Pending"
        }
      });
    } else {
      pendingLog = await CustodyLog.findByPk(id);
      if (pendingLog) {
        evidence = await Evidence.findByPk(pendingLog.evidenceId);
      }
    }

    if (!evidence) {
      return res.status(404).json({ error: "Evidence not found." });
    }

    if (!pendingLog) {
      return res.status(404).json({ error: "No pending custody transfer found for this evidence." });
    }

    // Verify authenticated user is the designated recipient or admin
    if (pendingLog.newCustodian !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Permission denied. Only the designated recipient can accept this transfer." });
    }

    const previousCustodianUser = await User.findByPk(pendingLog.previousCustodian);
    const newCustodianUser = await User.findByPk(req.user.id);

    const fromWallet = previousCustodianUser?.walletAddress || "0x0000000000000000000000000000000000000000";
    const toWallet = newCustodianUser?.walletAddress || "0x0000000000000000000000000000000000000000";

    console.log(`Executing custody transfer on blockchain...`);
    let txHash = null;
    let blockchainStatus = "NOT_ANCHORED";
    let blockchainError = null;

    try {
      const txReceipt = await blockchainService.transferCustody(id, toWallet, fromWallet);
      txHash = txReceipt.txHash;
      blockchainStatus = "CONFIRMED";
      console.log(`Custody transfer confirmed on blockchain: ${txHash}, Block: ${txReceipt.blockNumber}`);

      await logAudit({
        category: "CUSTODY",
        action: "CUSTODY_TRANSACTION_CONFIRMED",
        actorId: req.user.id,
        actorRole: req.user.role,
        evidenceId: id,
        caseId: evidence.caseId,
        blockchainTxId: txHash,
        details: {
          blockNumber: txReceipt.blockNumber,
          gasUsed: txReceipt.gasUsed,
          transferredTo: newCustodianUser?.name
        }
      });
    } catch (blockchainErr) {
      blockchainStatus = "FAILED";
      blockchainError = blockchainErr.message;
      console.warn("Custody transfer on blockchain failed:", blockchainError);
      txHash = null; // NEVER invent a 0xmock transaction hash

      await logAudit({
        category: "CUSTODY",
        action: "CUSTODY_TRANSACTION_FAILED",
        actorId: req.user.id,
        actorRole: req.user.role,
        evidenceId: id,
        caseId: evidence.caseId,
        status: "WARNING",
        details: {
          error: blockchainError,
          reason: "Ethereum custody transaction could not be anchored (node offline or exhibit not anchored on-chain). Custody recorded in database."
        }
      });
    }

    // Update pending log to Completed
    pendingLog.transferState = "Accepted";
    pendingLog.blockchainTxId = txHash;
    pendingLog.blockchainStatus = blockchainStatus;
    await pendingLog.save();

    // Update Evidence Current Custodian
    evidence.currentCustodian = req.user.id;
    await evidence.save();

    // Create Transfer Accepted Log
    const acceptanceLog = await CustodyLog.create({
      evidenceId: id,
      actorId: req.user.id,
      action: "transfer_accepted",
      previousCustodian: pendingLog.previousCustodian,
      newCustodian: req.user.id,
      transferState: "Completed",
      reason: pendingLog.reason,
      notes: acceptanceNotes || "Transfer verified and physically received in good condition",
      evidenceCondition: pendingLog.evidenceCondition,
      blockchainTxId: txHash,
      blockchainStatus: blockchainStatus,
      timestamp: new Date()
    });

    await logAudit({
      category: "CUSTODY",
      action: "CUSTODY_TRANSFER_ACCEPTED",
      actorId: req.user.id,
      actorRole: req.user.role,
      evidenceId: id,
      caseId: evidence.caseId,
      blockchainTxId: txHash,
      details: {
        acceptedBy: req.user.name,
        previousCustodian: previousCustodianUser?.name,
        blockchainStatus
      }
    });

    // Notify previous custodian
    if (pendingLog.previousCustodian) {
      await createNotification({
        userId: pendingLog.previousCustodian,
        title: "Custody Transfer Accepted",
        message: `${req.user.name} has officially accepted custody of "${evidence.evidenceName}".`,
        type: "TRANSFER",
        link: `/custody?evidenceId=${id}`
      });
    }

    return res.status(200).json({
      message: "Custody transfer accepted and on-chain blockchain witness registered.",
      evidence,
      acceptanceLog
    });

  } catch (error) {
    console.error("Accept custody transfer error:", error);
    return res.status(500).json({ error: "Failed to accept custody transfer: " + error.message });
  }
};

/**
 * Step 2B: Reject Custody Transfer
 */
exports.rejectTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { logId, rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ error: "Rejection justification reason is mandatory." });
    }

    let pendingLog = await CustodyLog.findOne({
      where: {
        evidenceId: id,
        ...(logId ? { id: logId } : {}),
        transferState: "Pending"
      }
    });

    if (!pendingLog) {
      pendingLog = await CustodyLog.findByPk(id);
    }

    if (!pendingLog || pendingLog.transferState !== "Pending") {
      return res.status(404).json({ error: "No pending custody transfer found to reject." });
    }

    if (pendingLog.newCustodian !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Permission denied. Only the recipient can reject this transfer." });
    }

    pendingLog.transferState = "Rejected";
    pendingLog.action = "transfer_rejected";
    pendingLog.reason = `Rejected by recipient: ${rejectionReason}`;
    await pendingLog.save();

    await logAudit({
      category: "CUSTODY",
      action: "CUSTODY_TRANSFER_REJECTED",
      actorId: req.user.id,
      actorRole: req.user.role,
      evidenceId: id,
      details: { rejectionReason }
    });

    if (pendingLog.previousCustodian) {
      await createNotification({
        userId: pendingLog.previousCustodian,
        title: "Custody Transfer Rejected",
        message: `${req.user.name} declined custody transfer request: "${rejectionReason}".`,
        type: "TRANSFER",
        link: `/custody?evidenceId=${id}`
      });
    }

    return res.status(200).json({
      message: "Custody transfer has been declined. Current custodian remains unchanged.",
      log: pendingLog
    });

  } catch (error) {
    console.error("Reject custody transfer error:", error);
    return res.status(500).json({ error: "Failed to reject custody transfer: " + error.message });
  }
};

/**
 * Step 2C: Cancel Pending Transfer (by initiator)
 */
exports.cancelTransfer = async (req, res) => {
  try {
    const { id } = req.params;

    const pendingLog = await CustodyLog.findOne({
      where: {
        evidenceId: id,
        transferState: "Pending"
      }
    });

    if (!pendingLog) {
      return res.status(404).json({ error: "No pending transfer found to cancel." });
    }

    if (pendingLog.actorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the initiator or an administrator can cancel a pending transfer." });
    }

    pendingLog.transferState = "Cancelled";
    pendingLog.action = "transfer_cancelled";
    await pendingLog.save();

    return res.status(200).json({
      message: "Pending custody transfer cancelled successfully.",
      log: pendingLog
    });
  } catch (error) {
    console.error("Cancel custody transfer error:", error);
    return res.status(500).json({ error: "Failed to cancel transfer: " + error.message });
  }
};

exports.getCustodyHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const evidence = await Evidence.findByPk(id, {
      include: [
        { model: Case, as: "case" },
        { model: User, as: "custodian", attributes: ["id", "name", "email", "role", "walletAddress"] }
      ]
    });
    if (!evidence) {
      return res.status(404).json({ error: "Evidence not found." });
    }

    const dbLogs = await CustodyLog.findAll({
      where: { evidenceId: id },
      include: [
        { model: User, as: "actor", attributes: ["id", "name", "role", "email"] },
        { model: User, as: "prevCustodian", attributes: ["id", "name", "email", "walletAddress"] },
        { model: User, as: "nextCustodian", attributes: ["id", "name", "email", "walletAddress"] }
      ],
      order: [["timestamp", "ASC"]]
    });

    let blockchainLogs = [];
    try {
      blockchainLogs = await blockchainService.getCustodyHistory(id);
    } catch (chainErr) {
      console.warn("Could not retrieve custody history from blockchain.");
    }

    return res.status(200).json({
      evidence,
      databaseHistory: dbLogs,
      blockchainHistory: blockchainLogs
    });
  } catch (error) {
    console.error("Get custody history error:", error);
    return res.status(500).json({ error: "Failed to retrieve custody history." });
  }
};
