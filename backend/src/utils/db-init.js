const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { sequelize, User, Case, Evidence, CustodyLog, VerificationLog } = require("../models");

function getMockCID(fileHash) {
  const md5Hash = crypto.createHash("md5").update(fileHash).digest("hex");
  const sha256Snippet = fileHash.substring(0, 28);
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let mockCid = "Qm";
  const combinedHex = sha256Snippet + md5Hash;
  for (let i = 0; i < 44; i++) {
    const charCode = combinedHex.charCodeAt(i % combinedHex.length) + i;
    mockCid += alphabet.charAt(charCode % alphabet.length);
  }
  return mockCid;
}

async function init() {
  try {
    console.log("Connecting to PostgreSQL and syncing models...");
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
        description: "Investigation of unauthorized access to the safety deposit lockers at Central Bank main vault. Primary evidence includes entrance CCTV footage, dispatch audio, and on-site forensic examination report.",
        createdBy: users[0].id,
      },
      {
        caseNumber: "PS-2026-002",
        title: "Titanium Corp Espionage Leak",
        description: "Leak of intellectual property documents regarding experimental fuel-cell batteries. Suspected internal leak via corporate email attachments.",
        createdBy: users[0].id,
      },
    ]);

    const demoDir = path.join(__dirname, "../../uploads/demo_files");
    const ipfsDir = path.join(__dirname, "../../uploads/ipfs_mock");
    if (!fs.existsSync(ipfsDir)) fs.mkdirSync(ipfsDir, { recursive: true });

    // Helper to get file info using fixed CID names from ipfs_mock
    const prepareFile = (filename, fixedCid) => {
      const p = path.join(demoDir, filename);
      if (!fs.existsSync(p)) return { hash: "none", cid: fixedCid, size: 0 };
      const buf = fs.readFileSync(p);
      const hash = crypto.createHash("sha256").update(buf).digest("hex");
      // Copy to ipfs_mock with fixed CID name
      fs.writeFileSync(path.join(ipfsDir, fixedCid), buf);
      return { hash, cid: fixedCid, size: buf.length };
    };

    const videoInfo = prepareFile("evidence_cctv.mp4", "QmXvideo001");
    const pdfInfo = prepareFile("forensic_report.pdf", "QmYpdf002");
    const audioInfo = prepareFile("dispatch_call.wav", "QmZaudio003");
    const photoInfo = prepareFile("crime_scene_photo.jpg", "QmWimage004");

    console.log("Seeding initial evidence records with real media files...");
    const evidence1 = await Evidence.create({
      caseId: cases[0].id,
      evidenceName: "evidence_cctv.mp4",
      fileType: "video/mp4",
      fileSize: videoInfo.size,
      fileHash: videoInfo.hash,
      ipfsCid: videoInfo.cid,
      submittedBy: users[0].id, // Investigator Alice
      blockchainTxId: "0x7894561230abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      submittedAt: new Date(Date.now() - 3600000 * 3),
      currentCustodian: users[1].id, // Transferred to Analyst Bob
      status: "REGISTERED",
      description: "Direct surveillance recording of the central vault door at 19:48:00 UTC.",
      collectionTimestamp: new Date(Date.now() - 3600000 * 5),
      location: "Central Vault - Camera #02",
    });

    const evidence2 = await Evidence.create({
      caseId: cases[0].id,
      evidenceName: "forensic_examination_report.pdf",
      fileType: "application/pdf",
      fileSize: pdfInfo.size,
      fileHash: pdfInfo.hash,
      ipfsCid: pdfInfo.cid,
      submittedBy: users[0].id, // Investigator Alice
      blockchainTxId: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      submittedAt: new Date(Date.now() - 3600000 * 2),
      currentCustodian: users[0].id, // Investigator Alice
      status: "REGISTERED",
      description: "Official preliminary crime scene inspection report and hardware write-blocker image verification.",
      collectionTimestamp: new Date(Date.now() - 3600000 * 4),
      location: "Cyber Forensics Field Unit 04",
    });

    const evidence3 = await Evidence.create({
      caseId: cases[0].id,
      evidenceName: "emergency_dispatch_call.wav",
      fileType: "audio/wav",
      fileSize: audioInfo.size,
      fileHash: audioInfo.hash,
      ipfsCid: audioInfo.cid,
      submittedBy: users[0].id, // Investigator Alice
      blockchainTxId: "0x9988776655abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      submittedAt: new Date(Date.now() - 3600000 * 1),
      currentCustodian: users[2].id, // Transferred to Court Official Charles
      status: "REGISTERED",
      description: "Audio capture of the incoming security dispatch alert notification.",
      collectionTimestamp: new Date(Date.now() - 3600000 * 6),
      location: "911 Command Communications Center",
    });

    const evidence4 = await Evidence.create({
      caseId: cases[0].id,
      evidenceName: "crime_scene_photo.jpg",
      fileType: "image/jpeg",
      fileSize: photoInfo.size,
      fileHash: photoInfo.hash,
      ipfsCid: photoInfo.cid,
      submittedBy: users[0].id,
      blockchainTxId: "0x5544332211abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      submittedAt: new Date(Date.now() - 3600000 * 4),
      currentCustodian: users[0].id,
      status: "REGISTERED",
      description: "High resolution forensic scene photograph of physical vault door lock mechanism.",
      collectionTimestamp: new Date(Date.now() - 3600000 * 6),
      location: "Main Chamber Door Outer Panel",
    });

    console.log("Seeding custody logs...");
    await CustodyLog.bulkCreate([
      {
        evidenceId: evidence1.id,
        actorId: users[0].id, // Alice
        action: "viewed",
        previousCustodian: users[0].id,
        newCustodian: users[0].id,
        blockchainTxId: null,
        timestamp: new Date(Date.now() - 3600000 * 2.8),
      },
      {
        evidenceId: evidence1.id,
        actorId: users[0].id, // Alice
        action: "transferred",
        previousCustodian: users[0].id,
        newCustodian: users[1].id, // to Bob
        blockchainTxId: "0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1",
        timestamp: new Date(Date.now() - 3600000 * 2.5),
      },
      {
        evidenceId: evidence1.id,
        actorId: users[1].id, // Bob
        action: "viewed",
        previousCustodian: users[1].id,
        newCustodian: users[1].id,
        blockchainTxId: null,
        timestamp: new Date(Date.now() - 3600000 * 2.0),
      },
      {
        evidenceId: evidence1.id,
        actorId: users[1].id, // Bob
        action: "downloaded",
        previousCustodian: users[1].id,
        newCustodian: users[1].id,
        blockchainTxId: null,
        timestamp: new Date(Date.now() - 3600000 * 1.8),
      },
      {
        evidenceId: evidence2.id,
        actorId: users[0].id, // Alice
        action: "viewed",
        previousCustodian: users[0].id,
        newCustodian: users[0].id,
        blockchainTxId: null,
        timestamp: new Date(Date.now() - 3600000 * 1.5),
      },
      {
        evidenceId: evidence3.id,
        actorId: users[0].id, // Alice
        action: "transferred",
        previousCustodian: users[0].id,
        newCustodian: users[2].id, // to Charles
        blockchainTxId: "0xdef789abc012def789abc012def789abc012def789abc012def789abc012def7",
        timestamp: new Date(Date.now() - 3600000 * 0.8),
      },
      {
        evidenceId: evidence4.id,
        actorId: users[0].id, // Alice
        action: "viewed",
        previousCustodian: users[0].id,
        newCustodian: users[0].id,
        blockchainTxId: null,
        timestamp: new Date(Date.now() - 3600000 * 3.5),
      },
    ]);

    console.log("Seeding verification logs...");
    await VerificationLog.bulkCreate([
      {
        evidenceId: evidence1.id,
        verifiedBy: users[1].id, // Bob
        submittedHash: videoInfo.hash, // Exact match
        originalHash: videoInfo.hash,
        result: "verified",
        timestamp: new Date(Date.now() - 3600000 * 1.2),
      },
      {
        evidenceId: evidence1.id,
        verifiedBy: users[2].id, // Charles
        submittedHash: "86182101687f97b6e92751f9859f515082161b34e5659e5572eb06a6b5860d5b", // Mismatch
        originalHash: videoInfo.hash,
        result: "tampered",
        timestamp: new Date(Date.now() - 3600000 * 0.5),
      },
      {
        evidenceId: evidence2.id,
        verifiedBy: users[0].id, // Alice
        submittedHash: pdfInfo.hash,
        originalHash: pdfInfo.hash,
        result: "verified",
        timestamp: new Date(Date.now() - 3600000 * 0.3),
      },
      {
        evidenceId: evidence3.id,
        verifiedBy: users[2].id, // Charles
        submittedHash: audioInfo.hash,
        originalHash: audioInfo.hash,
        result: "verified",
        timestamp: new Date(Date.now() - 3600000 * 0.2),
      },
    ]);

    console.log("✓ Database initialized & seeded successfully with real video, audio, PDF, and photo files!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }
}

init();
