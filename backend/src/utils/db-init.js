const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { sequelize, User, Case, Evidence, CustodyLog, VerificationLog, AuditLog, Notification } = require("../models");
const blockchainService = require("../services/blockchain.service");

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
        title: "Residential Burglary Investigation",
        description: "Investigation of unauthorized nighttime forced entry into a private residence. Two intruders captured on residential perimeter surveillance camera fleeing with stolen valuables. Physical point-of-entry toolmark photos, emergency dispatch communications, and preliminary forensic analysis reports attached. [Demonstration Training Scenario]",
        category: "Property Crime",
        status: "Under Investigation",
        priority: "Critical",
        createdBy: users[0].id,
        assignedInvestigatorId: users[0].id,
        assignedAnalystId: users[1].id,
      },
      {
        caseNumber: "PS-2026-002",
        title: "Hit-and-Run Road Accident Investigation",
        description: "Investigation of an urban road traffic collision where a motor vehicle struck a crossing pedestrian at a signaled intersection and left the scene without stopping or rendering aid. Exhibits include municipal roadside traffic camera footage, vehicle debris photography, emergency call recording, and accident reconstruction report. [Public Reference Case: Hartlepool Road Traffic Incident / Demonstration Data]",
        category: "Road Traffic Offence",
        status: "Open",
        priority: "High",
        createdBy: users[0].id,
        assignedInvestigatorId: users[0].id,
        assignedAnalystId: users[1].id,
      },
      {
        caseNumber: "PS-2026-003",
        title: "ATM Skimming and Financial Fraud Investigation",
        description: "Organized financial fraud investigation involving an illicit card-reader overlay and concealed pinhole camera fitted onto a retail automated teller machine to capture magnetic stripe track data and customer PIN entries. Exhibits include ATM kiosk surveillance, recovered skimming hardware photography, banking audit logs, and digital forensic examination report. [Public Reference Case: Bank ATM Skimming / Demonstration Data]",
        category: "Cyber / Financial Crime",
        status: "Pending Review",
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

    const videoInfo = prepareFile("original_cctv.mp4", "Qmvrkmy1qr39wx99wBEB42D556NGNNQSGXPHRHYLXYaTTW");
    const pdfInfo = prepareFile("fingerprint_examination_report.pdf", "Qmwikk13x7856s8A5B38J4DEKEHKCKUQMUHJWTTQccYRfS");
    const photoInfo = prepareFile("crime_scene_photo.png", "Qmwtkpkvxo1ruB55Ax8y457LEJQ89CTCSNXYZaUXWWXhdd");

    console.log("Seeding initial evidence records with genuine media files...");
    const evidence1 = await Evidence.create({
      caseId: cases[0].id,
      evidenceName: "original_cctv.mp4",
      category: "CCTV / Video",
      fileType: "video/mp4",
      fileSize: videoInfo.size,
      fileHash: videoInfo.hash,
      ipfsCid: videoInfo.cid,
      submittedBy: users[0].id, // Investigator Alice
      blockchainTxId: null,
      blockchainStatus: "NOT_ANCHORED",
      submittedAt: new Date(Date.now() - 3600000 * 3),
      currentCustodian: users[1].id, // Transferred to Analyst Bob
      status: "REGISTERED",
      retentionStatus: "Active",
      description: "Residential perimeter surveillance footage capturing intruder activity.",
      collectionTimestamp: new Date(Date.now() - 3600000 * 5),
      location: "Perimeter Driveway - Security Cam #02",
      acquisitionSource: "Residential Security DVR Server 01",
      acquisitionMethod: "Direct Bit-Stream Export via Write-Blocker",
      collectorIdentity: "Det. Alice Vance (Badge #PS-8841)",
      deviceInfo: "Lorex 4K NVR, S/N: LX-99014-B"
    });

    const evidence2 = await Evidence.create({
      caseId: cases[0].id,
      evidenceName: "fingerprint_examination_report.pdf",
      category: "PDF / Documents",
      fileType: "application/pdf",
      fileSize: pdfInfo.size,
      fileHash: pdfInfo.hash,
      ipfsCid: pdfInfo.cid,
      submittedBy: users[0].id,
      blockchainTxId: null,
      blockchainStatus: "NOT_ANCHORED",
      submittedAt: new Date(Date.now() - 3600000 * 2),
      currentCustodian: users[0].id,
      status: "REGISTERED",
      retentionStatus: "Under Legal Hold",
      legalHoldReason: "Statutory evidence hold requested by Grand Jury Subpoena #GJ-2026-99",
      legalHoldAppliedBy: users[3].id,
      legalHoldAppliedAt: new Date(Date.now() - 3600000 * 1),
      description: "Forensic fingerprint examination documentation and latent ridge comparison report (Exhibit FP-EX-01).",
      collectionTimestamp: new Date(Date.now() - 3600000 * 4),
      location: "Digital Forensics Mobile Unit Lab",
      acquisitionSource: "Laboratory Forensic Workstation",
      acquisitionMethod: "Digitally Signed Cryptographic PDF",
      collectorIdentity: "Forensic Analyst Bob Miller (Cert: EnCE, GCFE)",
      deviceInfo: "Forensic Tower Precision 7920, Windows 11 Forensics OS"
    });

    const evidence3 = await Evidence.create({
      caseId: cases[0].id,
      evidenceName: "crime_scene_photo.png",
      category: "Photographs",
      fileType: "image/png",
      fileSize: photoInfo.size,
      fileHash: photoInfo.hash,
      ipfsCid: photoInfo.cid,
      submittedBy: users[0].id,
      blockchainTxId: null,
      blockchainStatus: "NOT_ANCHORED",
      submittedAt: new Date(Date.now() - 3600000 * 4),
      currentCustodian: users[0].id,
      status: "REGISTERED",
      retentionStatus: "Active",
      description: "Photograph documenting the residential burglary scene and primary point of forced entry.",
      collectionTimestamp: new Date(Date.now() - 3600000 * 6),
      location: "Rear Patio Sliding Glass Door",
      acquisitionSource: "Nikon D850 Forensic Camera Kit",
      acquisitionMethod: "Raw DNG to Baseline PNG with Certified Forensic Scale",
      collectorIdentity: "Det. Alice Vance",
      deviceInfo: "Camera S/N: 3049182, 50mm f/1.8 Nikkor Lens"
    });

    // Attempt genuine on-chain anchoring if Ethereum node is reachable
    const safelyAnchorDemoEvidence = async (ev, rawFile, caseNum, submitterWallet) => {
      const filePath = path.join(demoDir, rawFile);
      if (!fs.existsSync(filePath)) return;
      const buf = fs.readFileSync(filePath);
      const calculated = crypto.createHash("sha256").update(buf).digest("hex");
      if (calculated.toLowerCase() !== ev.fileHash.toLowerCase()) return;

      try {
        const onChainCheck = await blockchainService.checkEvidenceOnChainStatus(ev.id);
        if (onChainCheck.nodeStatus === "OPERATIONAL" && onChainCheck.contractStatus === "OPERATIONAL") {
          if (onChainCheck.recordStatus === "RECORD_CONFIRMED_ON_CHAIN") {
            ev.blockchainStatus = "CONFIRMED";
            if (!ev.blockchainAnchoredAt) ev.blockchainAnchoredAt = new Date();
            await ev.save();
            return;
          }

          console.log(`[ON-CHAIN ANCHOR] Registering ${ev.evidenceName} on Ethereum contract...`);
          const receipt = await blockchainService.registerEvidence(
            ev.id,
            ev.fileHash,
            caseNum,
            ev.description || "Demo forensic exhibit",
            submitterWallet
          );
          ev.blockchainTxId = receipt.txHash;
          ev.blockchainBlockNumber = receipt.blockNumber;
          ev.blockchainStatus = "CONFIRMED";
          ev.blockchainAnchoredAt = new Date();
          await ev.save();
          console.log(`[ON-CHAIN ANCHOR CONFIRMED] Block ${receipt.blockNumber}, Tx: ${receipt.txHash}`);
        }
      } catch (e) {
        console.log(`[ON-CHAIN ANCHOR STANDBY] ${ev.evidenceName} remains unanchored: ${e.message}`);
      }
    };

    await safelyAnchorDemoEvidence(evidence1, "original_cctv.mp4", cases[0].caseNumber, users[0].walletAddress);
    await safelyAnchorDemoEvidence(evidence2, "fingerprint_examination_report.pdf", cases[0].caseNumber, users[0].walletAddress);
    await safelyAnchorDemoEvidence(evidence3, "crime_scene_photo.png", cases[0].caseNumber, users[0].walletAddress);

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
        blockchainTxId: evidence1.blockchainTxId,
        blockchainStatus: evidence1.blockchainStatus,
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
        blockchainTxId: null,
        blockchainStatus: "NOT_ANCHORED",
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
        blockchainTxId: null,
        blockchainStatus: "NOT_ANCHORED",
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
        action: "viewed",
        previousCustodian: users[0].id,
        newCustodian: users[0].id,
        transferState: "Completed",
        reason: "Initial crime scene photographic intake and cryptographic validation",
        evidenceCondition: "Digital Photographic Container #PS-8841-A",
        blockchainTxId: evidence3.blockchainTxId,
        blockchainStatus: evidence3.blockchainStatus,
        timestamp: new Date(Date.now() - 3600000 * 3.8),
      },
      {
        evidenceId: evidence3.id,
        actorId: users[0].id, // Alice
        action: "transfer_initiated",
        previousCustodian: users[0].id,
        newCustodian: users[1].id, // to Bob
        transferState: "Pending", // PENDING TRANSFER!
        reason: "Handoff to Forensic Lab for photogrammetric toolmark enhancement",
        evidenceCondition: "Digital Photographic Container #PS-8841-A",
        blockchainTxId: null,
        timestamp: new Date(Date.now() - 3600000 * 0.5),
      }
    ]);

    console.log("Seeding verification logs with integrity match and mismatch records...");
    await VerificationLog.bulkCreate([
      {
        evidenceId: evidence1.id,
        verifiedBy: users[1].id, // Bob
        submittedHash: videoInfo.hash,
        originalHash: videoInfo.hash,
        result: "verified",
        timestamp: new Date(Date.now() - 3600000 * 2.3)
      },
      {
        evidenceId: evidence1.id,
        verifiedBy: users[1].id, // Bob
        submittedHash: "606301cef0aaf3972feb9ab69dd3449e61cec3350a67d9f4a723de29da1597f2", // tampered hash
        originalHash: videoInfo.hash,
        result: "tampered", // TAMPER ALERT!
        timestamp: new Date(Date.now() - 3600000 * 1.8)
      },
      {
        evidenceId: evidence3.id,
        verifiedBy: users[0].id, // Alice
        submittedHash: photoInfo.hash,
        originalHash: photoInfo.hash,
        result: "verified",
        timestamp: new Date(Date.now() - 3600000 * 0.7)
      }
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
        blockchainTxId: null,
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
        message: 'Analyst Bob Miller has accepted custody of "original_cctv.mp4" for forensic extraction.',
        type: "TRANSFER",
        link: `/custody?evidenceId=${evidence1.id}`,
        isRead: false,
        timestamp: new Date(Date.now() - 3600000 * 2)
      },
      {
        userId: users[1].id, // Bob
        title: "New Case Assignment",
        message: 'You have been assigned as Lead Forensic Analyst on Case #PS-2026-001 (Residential Burglary Investigation).',
        type: "CASE",
        link: `/cases/${cases[0].id}`,
        isRead: false,
        timestamp: new Date(Date.now() - 3600000 * 4)
      },
      {
        userId: users[2].id, // Charles
        title: "Pretrial Evidence Admissibility",
        message: 'Incoming evidence "fingerprint_examination_report.pdf" ready for FRE 902(13)/(14) & BSA Section 63 review.',
        type: "EVIDENCE",
        link: `/evidence/${evidence2.id}`,
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
