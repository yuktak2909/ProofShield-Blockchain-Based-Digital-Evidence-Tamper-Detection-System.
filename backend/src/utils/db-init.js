const bcrypt = require("bcryptjs");
const { sequelize, User, Case, Evidence, CustodyLog, VerificationLog } = require("../models");

async function init() {
  try {
    console.log("Connecting to the database and syncing models...");
    // Sync models - drops tables if they exist and recreates them
    await sequelize.sync({ force: true });
    console.log("Database schema synced successfully.");

    console.log("Seeding demo users...");
    const saltRounds = 10;
    const passwordHash = bcrypt.hashSync("Password123", saltRounds);

    const users = await User.bulkCreate([
      {
        name: "Investigator Alice",
        email: "investigator@proofshield.com",
        passwordHash,
        role: "investigator",
        walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat Account #1
      },
      {
        name: "Analyst Bob",
        email: "analyst@proofshield.com",
        passwordHash,
        role: "analyst",
        walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Hardhat Account #2
      },
      {
        name: "Court Official Charles",
        email: "court@proofshield.com",
        passwordHash,
        role: "court",
        walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Hardhat Account #3
      },
      {
        name: "Admin Davis",
        email: "admin@proofshield.com",
        passwordHash,
        role: "admin",
        walletAddress: "0x15d34AAf54a67C68101F3096d248B130e90E3f0d", // Hardhat Account #4
      },
    ]);

    console.log("Seeding demo cases...");
    const cases = await Case.bulkCreate([
      {
        caseNumber: "PS-2026-001",
        title: "Central Bank Vault Intrusion",
        description: "Investigation of unauthorized access to the safety deposit lockers at Central Bank main vault. Main evidence includes lobby and corridor CCTV footage.",
        createdBy: users[0].id, // Investigator
      },
      {
        caseNumber: "PS-2026-002",
        title: "Titanium Corp Espionage Leak",
        description: "Leak of intellectual property documents regarding experimental fuel-cell batteries. Suspected internal leak via corporate email attachments.",
        createdBy: users[0].id,
      },
    ]);

    console.log("Seeding initial evidence records...");
    // Let's create evidence for Vault Intrusion
    const evidence1 = await Evidence.create({
      caseId: cases[0].id,
      evidenceName: "lobby_cctv_cam2_1950.mp4",
      fileType: "video/mp4",
      fileSize: 10485760, // 10MB
      fileHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", // Mock SHA-256
      ipfsCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      submittedBy: users[0].id, // Investigator
      blockchainTxId: "0x7894561230abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      submittedAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      currentCustodian: users[1].id, // Forensic Analyst
      status: "REGISTERED",
      description: "Lobby entrance CCTV recording between 19:45 and 20:00 on day of incident.",
      collectionTimestamp: new Date(Date.now() - 3600000 * 5),
      location: "Lobby Camera 2",
    });

    const evidence2 = await Evidence.create({
      caseId: cases[1].id,
      evidenceName: "design_blueprint_confidential.pdf",
      fileType: "application/pdf",
      fileSize: 2048576, // 2MB
      fileHash: "f1a5b8c9d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9",
      ipfsCid: "QmYwAPJhy5nArbeh7v5vab8uYnuYi42Xrnqn34oncaS2fQ",
      submittedBy: users[0].id, // Investigator
      blockchainTxId: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      submittedAt: new Date(Date.now() - 3600000 * 4), // 4 hours ago
      currentCustodian: users[0].id, // Investigator
      status: "REGISTERED",
      description: "Leaked PDF document showing confidential battery components blueprint.",
      collectionTimestamp: new Date(Date.now() - 3600000 * 8),
      location: "Target laptop storage",
    });

    console.log("Seeding custody logs...");
    await CustodyLog.bulkCreate([
      {
        evidenceId: evidence1.id,
        actorId: users[0].id, // Investigator Alice
        action: "viewed",
        previousCustodian: users[0].id,
        newCustodian: users[0].id,
        blockchainTxId: null,
        timestamp: new Date(Date.now() - 3600000 * 1.9),
      },
      {
        evidenceId: evidence1.id,
        actorId: users[0].id, // Investigator Alice
        action: "transferred",
        previousCustodian: users[0].id,
        newCustodian: users[1].id, // to Analyst Bob
        blockchainTxId: "0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1",
        timestamp: new Date(Date.now() - 3600000 * 1.5),
      },
      {
        evidenceId: evidence1.id,
        actorId: users[1].id, // Analyst Bob
        action: "viewed",
        previousCustodian: users[1].id,
        newCustodian: users[1].id,
        blockchainTxId: null,
        timestamp: new Date(Date.now() - 3600000 * 1.2),
      },
      {
        evidenceId: evidence1.id,
        actorId: users[1].id, // Analyst Bob
        action: "downloaded",
        previousCustodian: users[1].id,
        newCustodian: users[1].id,
        blockchainTxId: null,
        timestamp: new Date(Date.now() - 3600000 * 1.1),
      },
      {
        evidenceId: evidence2.id,
        actorId: users[0].id, // Investigator
        action: "viewed",
        previousCustodian: users[0].id,
        newCustodian: users[0].id,
        blockchainTxId: null,
        timestamp: new Date(Date.now() - 3600000 * 3.8),
      },
    ]);

    console.log("Seeding verification logs...");
    await VerificationLog.bulkCreate([
      {
        evidenceId: evidence1.id,
        verifiedBy: users[1].id, // Bob
        submittedHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", // match
        originalHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        result: "verified",
        timestamp: new Date(Date.now() - 3600000 * 1.0),
      },
      {
        evidenceId: evidence1.id,
        verifiedBy: users[2].id, // Court Charles
        submittedHash: "badhash44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", // mismatch!
        originalHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        result: "tampered",
        timestamp: new Date(Date.now() - 3600000 * 0.5),
      },
    ]);

    console.log("Database initialized and seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }
}

init();
