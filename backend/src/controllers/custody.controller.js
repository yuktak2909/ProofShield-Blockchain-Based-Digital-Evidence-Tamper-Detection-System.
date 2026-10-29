const { Evidence, CustodyLog, User } = require("../models");
const blockchainService = require("../services/blockchain.service");

exports.viewEvidence = async (req, res) => {
  try {
    const { id } = req.params;

    const evidence = await Evidence.findByPk(id);
    if (!evidence) {
      return res.status(404).json({ error: "Evidence not found." });
    }

    // Log the "viewed" event in PostgreSQL
    const log = await CustodyLog.create({
      evidenceId: id,
      actorId: req.user.id,
      action: "viewed",
      previousCustodian: evidence.currentCustodian,
      newCustodian: evidence.currentCustodian,
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

    // Log the "downloaded" event in PostgreSQL
    const log = await CustodyLog.create({
      evidenceId: id,
      actorId: req.user.id,
      action: "downloaded",
      previousCustodian: evidence.currentCustodian,
      newCustodian: evidence.currentCustodian,
      blockchainTxId: null,
      timestamp: new Date()
    });

    return res.status(200).json({ message: "Custody download logged.", log });
  } catch (error) {
    console.error("Log download error:", error);
    return res.status(500).json({ error: "Failed to log custody download." });
  }
};

exports.transferCustody = async (req, res) => {
  try {
    const { id } = req.params;
    const { newCustodianId } = req.body;

    if (!newCustodianId) {
      return res.status(400).json({ error: "newCustodianId is required." });
    }

    const evidence = await Evidence.findByPk(id);
    if (!evidence) {
      return res.status(404).json({ error: "Evidence not found." });
    }

    // Authorization: Only the current custodian can transfer custody
    if (evidence.currentCustodian !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Permission denied. Only the current custodian or an administrator can transfer this evidence." 
      });
    }

    // Find new custodian user details
    const newCustodian = await User.findByPk(newCustodianId);
    if (!newCustodian) {
      return res.status(404).json({ error: "New custodian user not found." });
    }

    const currentCustodianUser = await User.findByPk(evidence.currentCustodian);

    const fromWallet = currentCustodianUser.walletAddress || "0x0000000000000000000000000000000000000000";
    const toWallet = newCustodian.walletAddress || "0x0000000000000000000000000000000000000000";

    console.log(`Executing custody transfer on blockchain...`);
    let txHash = null;
    
    try {
      txHash = await blockchainService.transferCustody(id, toWallet, fromWallet);
      console.log(`Custody transfer confirmed on blockchain. Tx: ${txHash}`);
    } catch (blockchainErr) {
      console.warn("Blockchain connection error, writing state to DB only:", blockchainErr.message);
      // Generate a mock hash if local blockchain node is offline for development demonstration
      txHash = "0xmocktx" + Math.random().toString(36).substring(2) + "00000000000000000000000000";
    }

    const oldCustodianId = evidence.currentCustodian;

    // Update DB record
    evidence.currentCustodian = newCustodian.id;
    await evidence.save();

    // Log the "transferred" action in PostgreSQL
    const log = await CustodyLog.create({
      evidenceId: id,
      actorId: req.user.id,
      action: "transferred",
      previousCustodian: oldCustodianId,
      newCustodian: newCustodian.id,
      blockchainTxId: txHash,
      timestamp: new Date()
    });

    return res.status(200).json({
      message: "Custody transferred successfully.",
      evidence,
      log
    });
  } catch (error) {
    console.error("Transfer custody error:", error);
    return res.status(500).json({ error: "Failed to transfer custody: " + error.message });
  }
};

exports.getCustodyHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const evidence = await Evidence.findByPk(id);
    if (!evidence) {
      return res.status(404).json({ error: "Evidence not found." });
    }

    // Retrieve database records
    const dbLogs = await CustodyLog.findAll({
      where: { evidenceId: id },
      include: [
        { model: User, as: "actor", attributes: ["name", "role", "email"] },
        { model: User, as: "prevCustodian", attributes: ["name", "email", "walletAddress"] },
        { model: User, as: "nextCustodian", attributes: ["name", "email", "walletAddress"] }
      ],
      order: [["timestamp", "ASC"]]
    });

    // Retrieve blockchain smart contract records if available
    let blockchainLogs = [];
    try {
      blockchainLogs = await blockchainService.getCustodyHistory(id);
    } catch (chainErr) {
      console.warn("Could not retrieve custody history from blockchain. Smart contract node offline.");
    }

    return res.status(200).json({
      databaseHistory: dbLogs,
      blockchainHistory: blockchainLogs
    });
  } catch (error) {
    console.error("Get custody history error:", error);
    return res.status(500).json({ error: "Failed to retrieve custody history." });
  }
};
