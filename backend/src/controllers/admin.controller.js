const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const { User, Case, Evidence, CustodyLog, VerificationLog, AuditLog, sequelize } = require("../models");
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
    // 1. Four Operational KPI metrics from PostgreSQL
    const openInvestigations = await Case.count({ 
      where: { status: { [Op.ne]: "Closed" } } 
    });
    const registeredEvidence = await Evidence.count({ 
      where: { status: "REGISTERED" } 
    });
    const pendingCustodyTransfers = await CustodyLog.count({ 
      where: { transferState: "Pending" } 
    });
    const integrityAlerts = await VerificationLog.count({ 
      where: { result: "tampered" } 
    });

    // Additional reference counts
    const totalCases = await Case.count();
    const heldEvidence = await Evidence.count({ where: { retentionStatus: "Under Legal Hold" } });
    const totalVerifications = await VerificationLog.count();
    const totalCustodyEvents = await CustodyLog.count();

    // 2. Attention Required Alerts (Genuine backend records only)
    const attentionAlerts = [];

    // Alert Category A: Evidence integrity mismatch detected
    const tamperLogs = await VerificationLog.findAll({
      where: { result: "tampered" },
      limit: 5,
      order: [["timestamp", "DESC"]]
    });
    for (const log of tamperLogs) {
      const ev = await Evidence.findByPk(log.evidenceId, {
        include: [{ model: Case, as: "case", attributes: ["caseNumber", "title"] }]
      });
      attentionAlerts.push({
        id: `alert-tamper-${log.id}`,
        type: "INTEGRITY_MISMATCH",
        title: "Evidence Integrity Mismatch Detected",
        description: `Cryptographic digest mismatch detected for "${ev?.evidenceName || 'Evidence Asset'}". Target payload does not match Ethereum reference seal.`,
        caseId: ev?.case?.caseNumber || "UNKNOWN-CASE",
        caseDbId: ev?.caseId,
        evidenceId: log.evidenceId,
        evidenceName: ev?.evidenceName || "Unknown File",
        timestamp: log.timestamp,
        severity: "critical",
        actionLabel: "Investigate Mismatch",
        actionLink: `/verify?evidenceId=${log.evidenceId}`
      });
    }

    // Alert Category B: Custody transfer awaiting acceptance
    const pendingTransfers = await CustodyLog.findAll({
      where: { transferState: "Pending" },
      limit: 5,
      include: [
        { model: Evidence, as: "evidence", include: [{ model: Case, as: "case", attributes: ["caseNumber", "title"] }] },
        { model: User, as: "actor", attributes: ["name", "role"] },
        { model: User, as: "nextCustodian", attributes: ["name", "role"] }
      ],
      order: [["timestamp", "DESC"]]
    });
    for (const transfer of pendingTransfers) {
      attentionAlerts.push({
        id: `alert-transfer-${transfer.id}`,
        type: "CUSTODY_PENDING",
        title: "Custody Transfer Awaiting Acceptance",
        description: `Transfer initiated by ${transfer.actor?.name || 'Custodian'} to ${transfer.nextCustodian?.name || 'Officer'}. Reason: "${transfer.reason || 'Case progression'}".`,
        caseId: transfer.evidence?.case?.caseNumber || "CASE-FILE",
        caseDbId: transfer.evidence?.caseId,
        evidenceId: transfer.evidenceId,
        evidenceName: transfer.evidence?.evidenceName || "Evidence Asset",
        timestamp: transfer.timestamp,
        severity: "warning",
        actionLabel: "Review Transfer",
        actionLink: `/custody?evidenceId=${transfer.evidenceId}`
      });
    }

    // Alert Category C: Evidence awaiting baseline verification
    const allEvidence = await Evidence.findAll({
      where: { status: "REGISTERED" },
      include: [
        { model: VerificationLog, as: "verificationLogs", attributes: ["id"] },
        { model: Case, as: "case", attributes: ["caseNumber"] }
      ]
    });
    const unverifiedEvidence = allEvidence.filter(e => (!e.verificationLogs || e.verificationLogs.length === 0));
    for (const unv of unverifiedEvidence.slice(0, 3)) {
      attentionAlerts.push({
        id: `alert-unverified-${unv.id}`,
        type: "AWAITING_VERIFICATION",
        title: "Evidence Awaiting Baseline Verification",
        description: `Exhibit "${unv.evidenceName}" has not yet undergone initial hash comparison against the smart contract ledger.`,
        caseId: unv.case?.caseNumber || "CASE-FILE",
        caseDbId: unv.caseId,
        evidenceId: unv.id,
        evidenceName: unv.evidenceName,
        timestamp: unv.submittedAt,
        severity: "info",
        actionLabel: "Verify Hash",
        actionLink: `/verify?evidenceId=${unv.id}`
      });
    }

    // Alert Category D: Failed blockchain commitment
    const failedCommitments = await Evidence.findAll({
      where: { status: "REGISTRATION_FAILED" },
      include: [{ model: Case, as: "case", attributes: ["caseNumber"] }],
      limit: 2
    });
    for (const failed of failedCommitments) {
      attentionAlerts.push({
        id: `alert-failed-${failed.id}`,
        type: "FAILED_COMMITMENT",
        title: "Failed Blockchain Commitment",
        description: `Exhibit "${failed.evidenceName}" was stored in local vault but on-chain registration transaction failed to confirm.`,
        caseId: failed.case?.caseNumber || "CASE-FILE",
        caseDbId: failed.caseId,
        evidenceId: failed.id,
        evidenceName: failed.evidenceName,
        timestamp: failed.updatedAt,
        severity: "high",
        actionLabel: "Reconcile Ledger",
        actionLink: `/blockchain-records`
      });
    }

    // 3. Evidence Type Distribution (Real database counts)
    const cctvCount = await Evidence.count({ 
      where: { 
        [Op.or]: [
          { fileType: { [Op.like]: "video/%" } },
          { category: { [Op.like]: "%CCTV%" } },
          { category: { [Op.like]: "%Surveillance%" } }
        ] 
      } 
    });
    const photoCount = await Evidence.count({ 
      where: { 
        [Op.or]: [
          { fileType: { [Op.like]: "image/%" } },
          { category: { [Op.like]: "%Photo%" } }
        ] 
      } 
    });
    const audioCount = await Evidence.count({ 
      where: { 
        [Op.or]: [
          { fileType: { [Op.like]: "audio/%" } },
          { category: { [Op.like]: "%Audio%" } },
          { category: { [Op.like]: "%Dispatch%" } }
        ] 
      } 
    });
    const pdfCount = await Evidence.count({ 
      where: { 
        [Op.or]: [
          { fileType: "application/pdf" },
          { category: { [Op.like]: "%Report%" } },
          { category: { [Op.like]: "%Document%" } }
        ] 
      } 
    });
    const otherCount = Math.max(0, registeredEvidence - (cctvCount + photoCount + audioCount + pdfCount));

    const evidenceDistribution = [
      { name: "CCTV / Video", count: cctvCount, color: "#1D4ED8" },
      { name: "Photographs", count: photoCount, color: "#D97706" },
      { name: "Audio Recordings", count: audioCount, color: "#7C3AED" },
      { name: "PDF / Documents", count: pdfCount, color: "#059669" },
      ...(otherCount > 0 ? [{ name: "Other Formats", count: otherCount, color: "#64748B" }] : [])
    ];

    // 4. Verification Activity (Real logs)
    const allVerifications = await VerificationLog.findAll({
      order: [["timestamp", "ASC"]]
    });
    // Aggregate by date
    const dateMap = {};
    for (const v of allVerifications) {
      const d = new Date(v.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!dateMap[d]) dateMap[d] = { name: d, verified: 0, mismatches: 0 };
      if (v.result === "verified") {
        dateMap[d].verified += 1;
      } else {
        dateMap[d].mismatches += 1;
      }
    }
    const verificationActivity = Object.values(dateMap);
    if (verificationActivity.length === 0) {
      verificationActivity.push(
        { name: "Mon", verified: 0, mismatches: 0 },
        { name: "Tue", verified: 0, mismatches: 0 },
        { name: "Today", verified: 0, mismatches: 0 }
      );
    }

    // 5. Recently Registered Evidence (with true verification status)
    const rawRecentEvidence = await Evidence.findAll({
      limit: 5,
      include: [
        { model: Case, as: "case", attributes: ["id", "caseNumber", "title"] },
        { model: User, as: "custodian", attributes: ["name"] },
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

    const recentEvidence = rawRecentEvidence.map(ev => {
      const plain = ev.toJSON();
      const logs = plain.verificationLogs || [];
      if (logs.length > 0) {
        plain.integrityStatus = logs[0].result === "verified" ? "Hash Match" : "Hash Mismatch";
      } else {
        plain.integrityStatus = "Not Yet Verified";
      }
      return plain;
    });

    // 6. Recent Audit Activity with Professional Human-Readable Descriptions
    const rawAuditLogs = await AuditLog.findAll({
      limit: 8,
      order: [["timestamp", "DESC"]]
    });
    const rawCustodyLogs = await CustodyLog.findAll({
      limit: 8,
      include: [
        { model: User, as: "actor", attributes: ["name", "role"] },
        { model: User, as: "nextCustodian", attributes: ["name", "role"] },
        { model: Evidence, as: "evidence", attributes: ["id", "evidenceName", "caseId"], include: [{ model: Case, as: "case", attributes: ["caseNumber"] }] }
      ],
      order: [["timestamp", "DESC"]]
    });

    // Merge and format into human-readable activity feed
    const combinedFeed = [];

    for (const c of rawCustodyLogs) {
      let readableAction = "Chain of custody event recorded.";
      const actorName = c.actor?.name || "Custodian";
      const targetName = c.nextCustodian?.name || "Recipient Officer";
      const evName = c.evidence?.evidenceName || "evidence asset";

      switch (c.action) {
        case "transfer_initiated":
          readableAction = `${actorName} initiated a custody transfer to ${targetName}.`;
          break;
        case "transfer_accepted":
          readableAction = `${actorName} accepted the custody transfer.`;
          break;
        case "transfer_rejected":
          readableAction = `${actorName} declined the custody transfer handoff.`;
          break;
        case "legal_hold_applied":
          readableAction = `Evidence was placed under statutory legal hold.`;
          break;
        case "legal_hold_released":
          readableAction = `Statutory legal hold was officially released.`;
          break;
        case "viewed":
          readableAction = `${actorName} viewed and inspected the evidence record.`;
          break;
        case "downloaded":
          readableAction = `${actorName} downloaded the verified evidence container.`;
          break;
        case "transferred":
          readableAction = `${actorName} transferred evidence custody to ${targetName}.`;
          break;
        default:
          readableAction = `${actorName} performed custody action: ${c.action}.`;
      }

      combinedFeed.push({
        id: `custody-${c.id}`,
        actor: actorName,
        action: readableAction,
        rawAction: c.action,
        transferState: c.transferState,
        evidenceName: evName,
        evidenceId: c.evidenceId,
        caseNumber: c.evidence?.case?.caseNumber || "CASE-FILE",
        timestamp: c.timestamp,
        status: c.transferState || "Completed"
      });
    }

    // Sort feed by timestamp descending
    combinedFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivity = combinedFeed.slice(0, 8);

    return res.status(200).json({
      metrics: {
        openInvestigations,
        registeredEvidence,
        pendingCustodyTransfers,
        integrityAlerts,
        totalCases,
        heldEvidence,
        totalVerifications,
        totalCustodyEvents
      },
      attentionAlerts,
      evidenceDistribution,
      verificationActivity,
      recentEvidence,
      recentActivity
    });
  } catch (error) {
    console.error("Get system stats error:", error);
    return res.status(500).json({ error: "Failed to load dashboard analytics stats." });
  }
};

/**
 * System Status & Service Monitoring
 */
exports.getSystemHealth = async (req, res) => {
  const startTime = Date.now();
  const nowIso = new Date().toISOString();

  const components = {
    // 1. Database
    database: {
      name: "Database",
      status: "Unavailable",
      description: "Relational database maintaining cases, users, custody logs, and cryptographic indices.",
      lastCheck: nowIso,
      latencyMs: null,
      errorDetails: null,
      troubleshooting: "Ensure PostgreSQL service or SQLite file is accessible and has write permissions."
    },
    // 2. Blockchain Connection
    blockchainConnection: {
      name: "Blockchain Connection",
      status: "Unavailable",
      description: "Ethereum JSON-RPC node provider connectivity for on-chain cryptographic anchoring.",
      lastCheck: nowIso,
      latencyMs: null,
      chainId: null,
      blockNumber: null,
      errorDetails: null,
      troubleshooting: "Run 'npx hardhat node' or start the Ethereum JSON-RPC client on http://127.0.0.1:8545."
    },
    // 3. Smart Contract
    smartContract: {
      name: "Smart Contract",
      status: "Unavailable",
      description: "ProofShieldEvidence.sol Solidity smart contract deployed on the Ethereum ledger.",
      lastCheck: nowIso,
      latencyMs: null,
      address: blockchainService.CONTRACT_ADDRESS,
      errorDetails: null,
      troubleshooting: "Deploy the smart contract via 'npx hardhat run scripts/deploy.js --network localhost'."
    },
    // 4. Evidence Storage
    evidenceStorage: {
      name: "Evidence Storage",
      status: "Unavailable",
      description: "Content-addressed decentralized repository for digital evidence exhibits.",
      lastCheck: nowIso,
      latencyMs: null,
      fileCount: 0,
      errorDetails: null,
      troubleshooting: "Verify backend storage folder permissions and disk space in uploads/ directory."
    },
    // 5. SHA-256 Hash Verification Service
    hashVerification: {
      name: "SHA-256 Hash Verification Service",
      status: "Unavailable",
      description: "FIPS 180-4 compliant 256-bit cryptographic engine for bit-stream tamper detection.",
      lastCheck: nowIso,
      latencyMs: null,
      algorithm: "SHA-256",
      errorDetails: null,
      troubleshooting: "Ensure Node.js crypto module has access to system cryptographic primitives."
    }
  };

  // 1. Test Database
  try {
    const dbStart = Date.now();
    await sequelize.authenticate();
    components.database.latencyMs = Date.now() - dbStart;
    components.database.status = "Operational";
  } catch (dbErr) {
    components.database.status = "Unavailable";
    components.database.errorDetails = dbErr.message;
  }

  // 2. Test Blockchain & Smart Contract (Unified Authoritative Health Engine)
  const bcHealth = await blockchainService.getBlockchainHealth();

  components.blockchainConnection.status = bcHealth.node.status === "OPERATIONAL" ? "Operational" : "Unavailable";
  components.blockchainConnection.latencyMs = bcHealth.node.latencyMs;
  components.blockchainConnection.chainId = bcHealth.node.chainId;
  components.blockchainConnection.blockNumber = bcHealth.node.blockNumber; // integer, 0 is preserved
  components.blockchainConnection.errorDetails = bcHealth.node.error;
  components.blockchainConnection.troubleshooting = bcHealth.node.status === "OPERATIONAL" 
    ? null 
    : "Run 'npx hardhat node' or start the Ethereum JSON-RPC client on http://127.0.0.1:8545.";

  components.smartContract.status = bcHealth.smartContract.status === "OPERATIONAL"
    ? "Operational"
    : bcHealth.smartContract.status === "NOT_DEPLOYED"
    ? "Not Deployed"
    : "Unavailable";
  components.smartContract.address = bcHealth.smartContract.address;
  components.smartContract.owner = bcHealth.smartContract.owner;
  components.smartContract.latencyMs = bcHealth.smartContract.latencyMs;
  components.smartContract.hasBytecode = bcHealth.smartContract.hasBytecode;
  components.smartContract.errorDetails = bcHealth.smartContract.error;
  components.smartContract.troubleshooting = bcHealth.smartContract.troubleshooting;

  // 4. Test Evidence Storage
  try {
    const fsStart = Date.now();
    if (fs.existsSync(ipfsService.IPFS_MOCK_DIR)) {
      const files = fs.readdirSync(ipfsService.IPFS_MOCK_DIR);
      components.evidenceStorage.latencyMs = Date.now() - fsStart;
      components.evidenceStorage.fileCount = files.length;
      components.evidenceStorage.status = "Operational";
    } else {
      components.evidenceStorage.status = "Degraded";
      components.evidenceStorage.errorDetails = "Storage directory does not exist.";
    }
  } catch (fsErr) {
    components.evidenceStorage.status = "Unavailable";
    components.evidenceStorage.errorDetails = fsErr.message;
  }

  // 5. Test SHA-256 Hash Verification Service
  try {
    const hashStart = Date.now();
    const testBuf = Buffer.from("ProofShield-Integrity-Check-" + Date.now());
    const hash = crypto.createHash("sha256").update(testBuf).digest("hex");
    if (hash && hash.length === 64) {
      components.hashVerification.latencyMs = Date.now() - hashStart;
      components.hashVerification.status = "Operational";
    }
  } catch (hErr) {
    components.hashVerification.status = "Unavailable";
    components.hashVerification.errorDetails = hErr.message;
  }

  // Authoritative Overall System Status & Dynamic Description
  let overallStatus = "Operational";
  let summaryTitle = "All Core Subsystems Fully Functional";
  let summaryDescription = "Database, Ethereum RPC, smart contract, and cryptographic verification services operating within nominal parameters.";

  if (components.database.status === "Unavailable") {
    overallStatus = "Unavailable";
    summaryTitle = "Database Repository Offline";
    summaryDescription = "Unable to connect to the relational database. Immediate administrative action required.";
  } else if (bcHealth.node.status !== "OPERATIONAL") {
    overallStatus = "Degraded";
    summaryTitle = "Ethereum JSON-RPC Node Offline — Local Vault Protection Active";
    summaryDescription = `The Ethereum node at ${bcHealth.node.rpcUrl} is unreachable. Evidence records remain cryptographically secured in repository storage with SHA-256 verification.`;
  } else if (bcHealth.smartContract.status === "NOT_DEPLOYED") {
    overallStatus = "Degraded";
    summaryTitle = "Smart Contract Not Deployed on Active Chain — Node Connected";
    summaryDescription = `Ethereum node is operational on Chain ${bcHealth.node.chainId} (Block #${bcHealth.node.blockNumber}), but ProofShieldEvidence contract is not deployed at ${bcHealth.smartContract.address}. Deploy the contract to enable on-chain anchoring.`;
  } else if (bcHealth.smartContract.status !== "OPERATIONAL") {
    overallStatus = "Degraded";
    summaryTitle = "Smart Contract Execution Error — Node Connected";
    summaryDescription = `Ethereum node is operational on Chain ${bcHealth.node.chainId}, but the contract call reverted: ${bcHealth.smartContract.error}`;
  } else if (components.evidenceStorage.status === "Degraded") {
    overallStatus = "Degraded";
    summaryTitle = "Evidence Storage Degraded — Blockchain Operational";
    summaryDescription = "Evidence repository storage directory requires verification. Blockchain ledger is online.";
  }

  return res.status(200).json({
    status: overallStatus,
    summaryTitle,
    summaryDescription,
    timestamp: nowIso,
    uptimeSeconds: Math.floor(process.uptime()),
    responseTimeMs: Date.now() - startTime,
    latestBlockHeight: bcHealth.node.blockNumber !== null ? bcHealth.node.blockNumber : null,
    blockchainHealth: bcHealth,
    components
  });
};
