const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { sequelize, User, Case, Evidence, CustodyLog, VerificationLog, AuditLog, Notification } = require("../models");

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

    console.log("Seeding demo cases with enterprise metadata...");
    const cases = await Case.bulkCreate([
      {
        caseNumber: "PS-2026-001",
        title: "Central Bank Vault Intrusion",
        description: "Investigation of unauthorized access to the safety deposit lockers at Central Bank main vault. Primary evidence includes entrance CCTV footage, dispatch audio, and on-site forensic examination report.",
        category: "Physical Security Breach & Theft",
        status: "Under Investigation",
        priority: "Critical",
        createdBy: users[0].id,
        assignedInvestigatorId: users[0].id,
        assignedAnalystId: users[1].id,
      },
      {
        caseNumber: "PS-2026-002",
        title: "Titanium Corp Espionage Leak",
        description: "Leak of intellectual property documents regarding experimental fuel-cell batteries. Suspected internal leak via corporate email attachments.",
        category: "Corporate Cyber Espionage",
        status: "Pending Review",
        priority: "High",
        createdBy: users[0].id,
        assignedInvestigatorId: users[0].id,
        assignedAnalystId: users[1].id,
      },
      {
        caseNumber: "PS-2026-003",
        title: "Operation DarkNet Cryptolocker",
        description: "Ransomware extortion campaign against state utility infrastructure. Memory dumps, network packet captures, and bitcoin ransom notes collected.",
        category: "Critical Infrastructure Cyber Incident",
        status: "Open",
        priority: "Critical",
        createdBy: users[3].id,
        assignedInvestigatorId: users[0].id,
        assignedAnalystId: users[1].id,
      }
    ]);

    const demoDir = path.join(__dirname, "../../uploads/demo_files");
    const ipfsDir = path.join(__dirname, "../../uploads/ipfs_mock");
    if (!fs.existsSync(ipfsDir)) fs.mkdirSync(ipfsDir, { recursive: true });

    const prepareFile = (filename, fixedCid) => {
      const p = path.join(demoDir, filename);
      if (!fs.existsSync(p)) return { hash: "none", cid: fixedCid, size: 0 };
      const buf = fs.readFileSync(p);
      const hash = crypto.createHash("sha256").update(buf).digest("hex");
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
      category: "CCTV Surveillance Feed",
      fileType: "video/mp4",
      fileSize: videoInfo.size,
      fileHash: videoInfo.hash,
      ipfsCid: videoInfo.cid,
      submittedBy: users[0].id, // Investigator Alice
      blockchainTxId: "0x7894561230abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      submittedAt: new Date(Date.now() - 3600000 * 3),
      currentCustodian: users[1].id, // Transferred to Analyst Bob
      status: "REGISTERED",
      retentionStatus: "Active",
      description: "Direct surveillance recording of the central vault door at 19:48:00 UTC.",
      collectionTimestamp: new Date(Date.now() - 3600000 * 5),
      location: "Central Vault - Camera #02",
      acquisitionSource: "Hikvision NVR Server 04 (Internal Security Subnet)",
      acquisitionMethod: "Direct Bit-Stream Export via USB 3.0 Write-Blocker",
      collectorIdentity: "Badge #PS-8841 (Det. Alice Vance)",
      deviceInfo: "Seagate SkyHawk 4TB Surveillance HDD, S/N: WAA88910"
    });

    const evidence2 = await Evidence.create({
      caseId: cases[0].id,
      evidenceName: "forensic_examination_report.pdf",
      category: "Laboratory Examination Report",
      fileType: "application/pdf",
      fileSize: pdfInfo.size,
      fileHash: pdfInfo.hash,
      ipfsCid: pdfInfo.cid,
      submittedBy: users[0].id,
      blockchainTxId: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      submittedAt: new Date(Date.now() - 3600000 * 2),
      currentCustodian: users[0].id,
      status: "REGISTERED",
      retentionStatus: "Under Legal Hold",
      legalHoldReason: "Statutory evidence hold requested by Grand Jury Subpoena #GJ-2026-99",
      legalHoldAppliedBy: users[3].id,
      legalHoldAppliedAt: new Date(Date.now() - 3600000 * 1),
      description: "Official preliminary crime scene inspection report and hardware write-blocker image verification.",
      collectionTimestamp: new Date(Date.now() - 3600000 * 4),
      location: "Cyber Forensics Field Unit 04",
      acquisitionSource: "Digital Forensics Mobile Unit Lab Workstation",
      acquisitionMethod: "Signed Cryptographic PDF Export",
      collectorIdentity: "Forensic Analyst Bob Miller (Cert: EnCE, GCFE)",
      deviceInfo: "Forensic Tower Precision 7920, Windows 11 Forensics OS"
    });

    const evidence3 = await Evidence.create({
      caseId: cases[0].id,
      evidenceName: "emergency_dispatch_call.wav",
      category: "911 Dispatch Audio Stream",
      fileType: "audio/wav",
      fileSize: audioInfo.size,
      fileHash: audioInfo.hash,
      ipfsCid: audioInfo.cid,
      submittedBy: users[0].id,
      blockchainTxId: "0x9988776655abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      submittedAt: new Date(Date.now() - 3600000 * 1),
      currentCustodian: users[2].id, // Transferred to Court Official Charles
      status: "REGISTERED",
      retentionStatus: "Active",
      description: "Audio capture of the incoming security dispatch alert notification.",
      collectionTimestamp: new Date(Date.now() - 3600000 * 6),
      location: "911 Command Communications Center",
      acquisitionSource: "NiceLogger Public Safety Audio Archive",
      acquisitionMethod: "Uncompressed PCM WAV Export",
      collectorIdentity: "Communications Officer Sarah Jenkins",
      deviceInfo: "Avaya Enterprise Communications Server"
    });

    const evidence4 = await Evidence.create({
      caseId: cases[0].id,
      evidenceName: "crime_scene_photo.jpg",
      category: "On-Scene Crime Scene Photography",
      fileType: "image/jpeg",
      fileSize: photoInfo.size,
      fileHash: photoInfo.hash,
      ipfsCid: photoInfo.cid,
      submittedBy: users[0].id,
      blockchainTxId: "0x5544332211abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      submittedAt: new Date(Date.now() - 3600000 * 4),
      currentCustodian: users[0].id,
      status: "REGISTERED",
      retentionStatus: "Active",
      description: "High resolution forensic scene photograph of physical vault door lock mechanism.",
      collectionTimestamp: new Date(Date.now() - 3600000 * 6),
      location: "Main Chamber Door Outer Panel",
      acquisitionSource: "Nikon D850 Forensic Camera Kit",
      acquisitionMethod: "Raw DNG to Baseline JPEG with Certified Forensic Scale",
      collectorIdentity: "Det. Alice Vance",
      deviceInfo: "Camera S/N: 3049182, 50mm f/1.8 Nikkor Lens"
    });

    console.log("Seeding custody logs with two-step workflow metadata...");
    await CustodyLog.bulkCreate([
      {
        evidenceId: evidence1.id,
        actorId: users[0].id, // Alice
        action: "viewed",
        previousCustodian: users[0].id,
        newCustodian: users[0].id,
        transferState: "Completed",
        reason: "Initial evidentiary triage and file hashing",
        evidenceCondition: "Intact / Verified Cryptographic Container",
        blockchainTxId: null,
        timestamp: new Date(Date.now() - 3600000 * 2.8),
      },
      {
        evidenceId: evidence1.id,
        actorId: users[0].id, // Alice
        action: "transfer_initiated",
        previousCustodian: users[0].id,
        newCustodian: users[1].id, // to Bob
        transferState: "Completed",
        reason: "Handoff to Digital Forensics Laboratory for deep video metadata extraction",
        evidenceCondition: "Sealed bit-stream disk image container",
        blockchainTxId: "0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1",
        timestamp: new Date(Date.now() - 3600000 * 2.5),
      },
      {
        evidenceId: evidence1.id,
        actorId: users[1].id, // Bob
        action: "transfer_accepted",
        previousCustodian: users[0].id,
        newCustodian: users[1].id,
        transferState: "Completed",
        reason: "Accepted by forensic examiner. Checksum verified upon physical delivery.",
        evidenceCondition: "Intact / Verified Cryptographic Container",
        blockchainTxId: "0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1",
        timestamp: new Date(Date.now() - 3600000 * 2.4),
      },
      {
        evidenceId: evidence2.id,
        actorId: users[3].id, // Admin
        action: "legal_hold_applied",
        previousCustodian: users[0].id,
        newCustodian: users[0].id,
        transferState: "Completed",
        reason: "Grand Jury Subpoena #GJ-2026-99 mandatory hold",
        evidenceCondition: "Sealed and Protected",
        timestamp: new Date(Date.now() - 3600000 * 1.0),
      },
      {
        evidenceId: evidence3.id,
        actorId: users[0].id, // Alice
        action: "transferred",
        previousCustodian: users[0].id,
        newCustodian: users[2].id, // to Charles
        transferState: "Completed",
        reason: "Submitted to Clerk of the Court for evidentiary pretrial admissibility hearing",
        evidenceCondition: "Intact / Verified Cryptographic Container",
        blockchainTxId: "0xdef789abc012def789abc012def789abc012def789abc012def789abc012def7",
        timestamp: new Date(Date.now() - 3600000 * 0.8),
      },
    ]);

    console.log("Seeding audit logs...");
    await AuditLog.bulkCreate([
      {
        category: "AUTH",
        action: "USER_LOGIN_SUCCESS",
        actorId: users[0].id,
        actorRole: "investigator",
        ipAddress: "127.0.0.1",
        details: "Investigator Alice initialized authenticated session",
        timestamp: new Date(Date.now() - 3600000 * 5)
      },
      {
        category: "CASE",
        action: "CASE_CREATED",
        actorId: users[0].id,
        actorRole: "investigator",
        caseId: cases[0].id,
        details: JSON.stringify({ caseNumber: "PS-2026-001", priority: "Critical" }),
        timestamp: new Date(Date.now() - 3600000 * 4.9)
      },
      {
        category: "EVIDENCE",
        action: "EVIDENCE_REGISTERED",
        actorId: users[0].id,
        actorRole: "investigator",
        caseId: cases[0].id,
        evidenceId: evidence1.id,
        blockchainTxId: evidence1.blockchainTxId,
        details: JSON.stringify({ evidenceName: evidence1.evidenceName, sha256: evidence1.fileHash }),
        timestamp: new Date(Date.now() - 3600000 * 3)
      },
      {
        category: "CUSTODY",
        action: "CUSTODY_TRANSFER_ACCEPTED",
        actorId: users[1].id,
        actorRole: "analyst",
        caseId: cases[0].id,
        evidenceId: evidence1.id,
        blockchainTxId: "0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1",
        details: "Forensic Analyst Bob accepted physical custody of surveillance footage",
        timestamp: new Date(Date.now() - 3600000 * 2.4)
      },
      {
        category: "RETENTION",
        action: "LEGAL_HOLD_APPLIED",
        actorId: users[3].id,
        actorRole: "admin",
        caseId: cases[0].id,
        evidenceId: evidence2.id,
        details: "Grand Jury Subpoena hold applied. Deletion locks engaged.",
        timestamp: new Date(Date.now() - 3600000 * 1.0)
      }
    ]);

    console.log("Seeding notifications...");
    await Notification.bulkCreate([
      {
        userId: users[0].id, // Alice
        title: "Custody Handoff Accepted",
        message: 'Analyst Bob Miller has accepted custody of "evidence_cctv.mp4" for forensic extraction.',
        type: "TRANSFER",
        link: `/custody?evidenceId=${evidence1.id}`,
        isRead: false,
        timestamp: new Date(Date.now() - 3600000 * 2)
      },
      {
        userId: users[1].id, // Bob
        title: "New Case Assignment",
        message: 'You have been assigned as Lead Forensic Analyst on Case #PS-2026-001 (Central Bank Vault Intrusion).',
        type: "CASE",
        link: `/cases/${cases[0].id}`,
        isRead: false,
        timestamp: new Date(Date.now() - 3600000 * 4)
      },
      {
        userId: users[2].id, // Charles
        title: "Pretrial Evidence Admissibility",
        message: 'Incoming evidence "emergency_dispatch_call.wav" ready for FRE 902(13)/(14) & BSA Section 63 review.',
        type: "EVIDENCE",
        link: `/evidence/${evidence3.id}`,
        isRead: true,
        timestamp: new Date(Date.now() - 3600000 * 0.7)
      }
    ]);

    console.log("✓ Database initialized & seeded successfully with enterprise forensic schema!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }
}

init();
