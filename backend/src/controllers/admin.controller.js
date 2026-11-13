const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const { User, Case, Evidence, CustodyLog, sequelize } = require("../models");
const blockchainService = require("../services/blockchain.service");
const ipfsService = require("../services/ipfs.service");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role", "walletAddress", "createdAt"],
      order: [["createdAt", "DESC"]]
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error("Admin getUsers error:", error);
    return res.status(500).json({ error: "Failed to retrieve user accounts." });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, walletAddress } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Name, email, password, and role are required." });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already in use." });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      walletAddress
    });

    return res.status(201).json({
      message: "User account created successfully.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        walletAddress: newUser.walletAddress
      }
    });
  } catch (error) {
    console.error("Admin createUser error:", error);
    return res.status(500).json({ error: "Failed to create user account: " + error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, walletAddress, password } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User account not found." });
    }

    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        return res.status(400).json({ error: "Email is already in use by another user." });
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (walletAddress) user.walletAddress = walletAddress;
    
    if (password) {
      user.passwordHash = bcrypt.hashSync(password, 10);
    }

    await user.save();

    return res.status(200).json({
      message: "User account updated successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress
      }
    });
  } catch (error) {
    console.error("Admin updateUser error:", error);
    return res.status(500).json({ error: "Failed to update user account." });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own active administrator session." });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User account not found." });
    }

    await user.destroy();
    return res.status(200).json({ message: "User account deleted successfully." });
  } catch (error) {
    console.error("Admin deleteUser error:", error);
    return res.status(500).json({ error: "Failed to delete user account." });
  }
};

exports.getSystemStats = async (req, res) => {
  try {
    const totalCases = await Case.count();
    const totalEvidence = await Evidence.count();
    const verifiedEvidence = await Evidence.count({ where: { status: "REGISTERED" } });
    const heldEvidence = await Evidence.count({ where: { retentionStatus: "Under Legal Hold" } });
    
    const totalVerifications = await require("../models/VerificationLog").count();
    const tamperAlerts = await require("../models/VerificationLog").count({
      where: { result: "tampered" }
    });
    
    const totalCustodyEvents = await CustodyLog.count();

    const recentEvidence = await Evidence.findAll({
      limit: 5,
      include: [
        { model: Case, as: "case", attributes: ["caseNumber", "title"] },
        { model: User, as: "submitter", attributes: ["name"] }
      ],
      order: [["submittedAt", "DESC"]]
    });

    const recentCustody = await CustodyLog.findAll({
      limit: 5,
      include: [
        { model: User, as: "actor", attributes: ["name", "role"] },
        { model: Evidence, as: "evidence", attributes: ["evidenceName"] }
      ],
      order: [["timestamp", "DESC"]]
    });

    return res.status(200).json({
      stats: {
        totalCases,
        totalEvidence,
        verifiedEvidence,
        heldEvidence,
        tamperAlerts,
        totalVerifications,
        totalCustodyEvents
      },
      recentEvidence,
      recentCustody
    });
  } catch (error) {
    console.error("Get system stats error:", error);
    return res.status(500).json({ error: "Failed to load dashboard analytics stats." });
  }
};

/**
 * System Diagnostics & Health Monitoring (Part 13)
 */
exports.getSystemHealth = async (req, res) => {
  const startTime = Date.now();
  const checks = {
    database: { status: "Unavailable", latencyMs: null, details: null },
    blockchainRpc: { status: "Unavailable", latencyMs: null, chainId: null, blockNumber: null },
    smartContract: { status: "Unavailable", address: blockchainService.CONTRACT_ADDRESS },
    ipfsGateway: { status: "Unavailable", directory: ipfsService.IPFS_MOCK_DIR },
    overall: "Operational"
  };

  // 1. Database Check
  try {
    const dbStart = Date.now();
    await sequelize.authenticate();
    checks.database.status = "Operational";
    checks.database.latencyMs = Date.now() - dbStart;
    checks.database.details = "PostgreSQL pool connected";
  } catch (dbErr) {
    checks.database.status = "Degraded";
    checks.database.details = dbErr.message;
    checks.overall = "Degraded";
  }

  // 2. Blockchain RPC Check
  try {
    const rpcStart = Date.now();
    if (blockchainService.provider) {
      const [net, blockNum] = await Promise.all([
        blockchainService.provider.getNetwork(),
        blockchainService.provider.getBlockNumber()
      ]);
      checks.blockchainRpc.status = "Operational";
      checks.blockchainRpc.latencyMs = Date.now() - rpcStart;
      checks.blockchainRpc.chainId = Number(net.chainId);
      checks.blockchainRpc.blockNumber = blockNum;
    }
  } catch (rpcErr) {
    checks.blockchainRpc.status = "Unavailable";
    checks.overall = "Degraded";
  }

  // 3. Smart Contract Verification
  try {
    if (blockchainService.contract) {
      const owner = await blockchainService.contract.owner();
      checks.smartContract.status = "Operational";
      checks.smartContract.owner = owner;
    }
  } catch (scErr) {
    checks.smartContract.status = "Unavailable";
  }

  // 4. IPFS Mock Storage Check
  try {
    if (fs.existsSync(ipfsService.IPFS_MOCK_DIR)) {
      const fileCount = fs.readdirSync(ipfsService.IPFS_MOCK_DIR).length;
      checks.ipfsGateway.status = "Operational";
      checks.ipfsGateway.fileCount = fileCount;
    }
  } catch (fsErr) {
    checks.ipfsGateway.status = "Degraded";
  }

  return res.status(200).json({
    status: checks.overall,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    memoryUsageMb: (process.memoryUsage().rss / (1024 * 1024)).toFixed(1),
    responseTimeMs: Date.now() - startTime,
    components: checks
  });
};
