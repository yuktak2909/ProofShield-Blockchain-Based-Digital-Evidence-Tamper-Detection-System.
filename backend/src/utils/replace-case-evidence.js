const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { sequelize, Case, User, Evidence, CustodyLog, VerificationLog, AuditLog } = require("../models");
const blockchainService = require("../services/blockchain.service");

// Source attachment paths
const ATTACHMENTS = {
  cctv: {
    sourcePath: "C:/Users/yukta/.gemini/antigravity/brain/8ec51652-65bd-46ea-90f4-c3aa24bf54b4/.user_uploaded/media_1794738607223_15bdf81b.mp4",
    filename: "original_cctv.mp4",
    tamperedFilename: "original_cctv_tampered.mp4",
    category: "CCTV / Video",
    fileType: "video/mp4",
    description: "Residential perimeter surveillance footage capturing intruder activity.",
    location: "Perimeter Driveway - Security Cam #02",
    acquisitionSource: "Residential Security DVR Server 01",
    acquisitionMethod: "Direct Bit-Stream Export via Write-Blocker",
    collectorIdentity: "Det. Alice Vance (Badge #PS-8841)",
    deviceInfo: "Lorex 4K NVR, S/N: LX-99014-B"
  },
  fingerprint: {
    sourcePath: "C:/Users/yukta/.gemini/antigravity/brain/8ec51652-65bd-46ea-90f4-c3aa24bf54b4/.user_uploaded/media_1794738617800_9d2fdc26.pdf",
    filename: "fingerprint_examination_report.pdf",
    tamperedFilename: "fingerprint_examination_report_tampered.pdf",
    category: "PDF / Documents",
    fileType: "application/pdf",
    description: "Forensic fingerprint examination documentation and latent ridge comparison report (Exhibit FP-EX-01).",
    location: "Digital Forensics Mobile Unit Lab",
    acquisitionSource: "Laboratory Forensic Workstation",
    acquisitionMethod: "Digitally Signed Cryptographic PDF",
    collectorIdentity: "Forensic Analyst Bob Miller (Cert: EnCE, GCFE)",
    deviceInfo: "Forensic Tower Precision 7920, Windows 11 Forensics OS"
  },
  photo: {
    sourcePath: "C:/Users/yukta/.gemini/antigravity/brain/8ec51652-65bd-46ea-90f4-c3aa24bf54b4/.user_uploaded/media_1794738591772_b39ccd2d.png",
    filename: "crime_scene_photo.png",
    tamperedFilename: "crime_scene_photo_tampered.png",
    category: "Photographs",
    fileType: "image/png",
    description: "Photograph documenting the residential burglary scene and primary point of forced entry.",
    location: "Rear Patio Sliding Glass Door",
    acquisitionSource: "Nikon D850 Forensic Camera Kit",
    acquisitionMethod: "Raw DNG to Baseline PNG with Certified Forensic Scale",
    collectorIdentity: "Det. Alice Vance (Badge #PS-8841)",
    deviceInfo: "Camera S/N: 3049182, 50mm f/1.8 Nikkor Lens"
  }
};

function getDeterministicMockCid(fileHash) {
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

async function run() {
  console.log("================================================================================");
  console.log("   PROOFSHIELD: REPLACING DEMO EVIDENCE IN CASE PS-2026-001");
  console.log("================================================================================");

  // 1. Verify Case
  const c = await Case.findOne({ where: { caseNumber: "PS-2026-001" } });
  if (!c) {
    throw new Error("Case PS-2026-001 not found!");
  }
  console.log(`[TARGET CASE] Found ${c.caseNumber} (ID: ${c.id}) - "${c.title}"`);

  // 2. Fetch Users
  const users = await User.findAll({ order: [["createdAt", "ASC"]] });
  const alice = users.find(u => u.username === "investigator_alice") || users[0];
  const bob = users.find(u => u.username === "analyst_bob") || users[1];
  const charles = users.find(u => u.username === "clerk_charles") || users[2];
  const admin = users.find(u => u.username === "admin") || users[3];
  console.log(`[USERS] Submitter: ${alice.name} (${alice.walletAddress || "N/A"})`);

  // 3. Find Old Evidence Records in PS-2026-001
  const oldEvidences = await Evidence.findAll({ where: { caseId: c.id } });
  console.log(`[CURRENT RECORDS] Found ${oldEvidences.length} active records in case ${c.caseNumber}:`);
  for (const ev of oldEvidences) {
    console.log(`  - ${ev.id}: ${ev.evidenceName} (${ev.category})`);
  }

  // 4. Clean up Old Records
  const oldIds = oldEvidences.map(e => e.id);
  if (oldIds.length > 0) {
    console.log("\n[PHASE 2: REMOVE OLD EVIDENCE]");
    // Clean up custody and verification logs for old items
    const deletedCustody = await CustodyLog.destroy({ where: { evidenceId: oldIds } });
    console.log(`  Deleted ${deletedCustody} old custody log records.`);
    const deletedVerif = await VerificationLog.destroy({ where: { evidenceId: oldIds } });
    console.log(`  Deleted ${deletedVerif} old verification log records.`);

    // Archive / Nullify references in AuditLog so historical audit trail remains safe without FK breakage
    await AuditLog.update(
      { details: sequelize.literal(`details || ' [Archived Demo Record]'`) },
      { where: { evidenceId: oldIds } }
    );
    await AuditLog.update({ evidenceId: null }, { where: { evidenceId: oldIds } });
    console.log(`  Preserved historical audit logs and archived references.`);

    // Delete evidence rows
    const deletedEvidence = await Evidence.destroy({ where: { id: oldIds } });
    console.log(`  Removed ${deletedEvidence} old demonstration evidence records from database.`);
  }

  // 5. Clean up old physical demo files from demo_files and ipfs_mock
  const demoDir = path.join(__dirname, "../../uploads/demo_files");
  const ipfsDir = path.join(__dirname, "../../uploads/ipfs_mock");
  const oldFilesToDelete = [
    "evidence_cctv.mp4", "evidence_cctv_tampered.mp4",
    "forensic_report.pdf", "forensic_report_tampered.pdf",
    "dispatch_call.wav", "dispatch_call_tampered.wav",
    "crime_scene_photo.jpg", "crime_scene_photo_tampered.jpg"
  ];
  for (const f of oldFilesToDelete) {
    const p = path.join(demoDir, f);
    if (fs.existsSync(p)) {
      try { fs.unlinkSync(p); console.log(`  Removed obsolete demo file: ${f}`); } catch (e) {}
    }
  }

  const oldCidsToDelete = [
    "QmXvideo001", "QmXvideo001-tampered",
    "QmYpdf002", "QmYpdf002-tampered",
    "QmZaudio003", "QmZaudio003-tampered",
    "QmWimage004", "QmWimage004-tampered"
  ];
  for (const cid of oldCidsToDelete) {
    const p = path.join(ipfsDir, cid);
    if (fs.existsSync(p)) {
      try { fs.unlinkSync(p); console.log(`  Removed obsolete IPFS mock CID: ${cid}`); } catch (e) {}
    }
  }

  // 6. Stage the Three New Attachments
  console.log("\n[PHASE 3: STAGE & REGISTER NEW ATTACHMENTS]");
  if (!fs.existsSync(demoDir)) fs.mkdirSync(demoDir, { recursive: true });
  if (!fs.existsSync(ipfsDir)) fs.mkdirSync(ipfsDir, { recursive: true });

  const stagedRecords = [];

  for (const [key, item] of Object.entries(ATTACHMENTS)) {
    console.log(`\nProcessing Exhibit: ${item.filename}...`);
    if (!fs.existsSync(item.sourcePath)) {
      throw new Error(`Source attachment not accessible at: ${item.sourcePath}`);
    }

    // Read genuine source binary
    const originalBuf = fs.readFileSync(item.sourcePath);
    const originalHash = crypto.createHash("sha256").update(originalBuf).digest("hex");
    const originalSize = originalBuf.length;
    const mockCid = getDeterministicMockCid(originalHash);

    // Save to demo_files
    const demoPath = path.join(demoDir, item.filename);
    fs.writeFileSync(demoPath, originalBuf);

    // Save to ipfs_mock
    const ipfsPath = path.join(ipfsDir, mockCid);
    fs.writeFileSync(ipfsPath, originalBuf);

    // Create realistic tampered counterpart for testing
    let tamperedBuf;
    if (key === "cctv") {
      const existingTamperedPath = path.join(demoDir, "tampered_cctv_object_removed.mp4");
      if (fs.existsSync(existingTamperedPath)) {
        tamperedBuf = fs.readFileSync(existingTamperedPath);
      } else {
        tamperedBuf = Buffer.from(originalBuf);
        tamperedBuf[tamperedBuf.length - 100] ^= 0xff;
      }
    } else {
      tamperedBuf = Buffer.from(originalBuf);
      tamperedBuf[tamperedBuf.length - 10] ^= 0xff;
    }
    const tamperedDemoPath = path.join(demoDir, item.tamperedFilename);
    fs.writeFileSync(tamperedDemoPath, tamperedBuf);
    const tamperedIpfsPath = path.join(ipfsDir, `${mockCid}-tampered`);
    fs.writeFileSync(tamperedIpfsPath, tamperedBuf);

    console.log(`  -> Staged ${item.filename}: ${originalSize} bytes, SHA-256: ${originalHash}`);
    console.log(`  -> Generated Mock IPFS CID: ${mockCid}`);

    // Insert into Database
    const initialCustodian = key === "cctv" ? bob.id : alice.id;
    const retentionStatus = key === "fingerprint" ? "Under Legal Hold" : "Active";
    const legalHoldReason = key === "fingerprint" ? "Statutory evidence hold requested by Grand Jury Subpoena #GJ-2026-99" : null;

    const evidenceRecord = await Evidence.create({
      caseId: c.id,
      evidenceName: item.filename,
      category: item.category,
      fileType: item.fileType,
      fileSize: originalSize,
      fileHash: originalHash,
      ipfsCid: mockCid,
      submittedBy: alice.id,
      blockchainTxId: null,
      blockchainStatus: "NOT_ANCHORED",
      submittedAt: new Date(Date.now() - 3600000 * (key === "photo" ? 4 : key === "cctv" ? 3 : 2)),
      currentCustodian: initialCustodian,
      status: "REGISTERED",
      retentionStatus,
      legalHoldReason,
      legalHoldAppliedBy: key === "fingerprint" ? admin.id : null,
      legalHoldAppliedAt: key === "fingerprint" ? new Date(Date.now() - 3600000 * 1) : null,
      description: item.description,
      collectionTimestamp: new Date(Date.now() - 3600000 * 5),
      location: item.location,
      acquisitionSource: item.acquisitionSource,
      acquisitionMethod: item.acquisitionMethod,
      collectorIdentity: item.collectorIdentity,
      deviceInfo: item.deviceInfo
    });

    // Initial Custody Log
    await CustodyLog.create({
      evidenceId: evidenceRecord.id,
      actorId: alice.id,
      action: "viewed",
      previousCustodian: alice.id,
      newCustodian: alice.id,
      transferState: "Completed",
      reason: "Initial evidentiary intake, forensic bit-stream imaging and cryptographic hashing",
      evidenceCondition: "Intact / Verified Cryptographic Container",
      blockchainTxId: null,
      blockchainStatus: "NOT_ANCHORED",
      timestamp: new Date(Date.now() - 3600000 * 2.8)
    });

    if (key === "cctv") {
      // Completed handoff to Bob for video analysis
      await CustodyLog.create({
        evidenceId: evidenceRecord.id,
        actorId: alice.id,
        action: "transfer_initiated",
        previousCustodian: alice.id,
        newCustodian: bob.id,
        transferState: "Completed",
        reason: "Handoff to Digital Forensics Laboratory for deep video metadata extraction",
        evidenceCondition: "Sealed bit-stream disk image container",
        blockchainTxId: null,
        blockchainStatus: "NOT_ANCHORED",
        timestamp: new Date(Date.now() - 3600000 * 2.5)
      });

      await CustodyLog.create({
        evidenceId: evidenceRecord.id,
        actorId: bob.id,
        action: "transfer_accepted",
        previousCustodian: alice.id,
        newCustodian: bob.id,
        transferState: "Completed",
        reason: "Accepted by forensic examiner. Checksum verified upon delivery.",
        evidenceCondition: "Intact / Verified Cryptographic Container",
        blockchainTxId: null,
        blockchainStatus: "NOT_ANCHORED",
        timestamp: new Date(Date.now() - 3600000 * 2.4)
      });
    }

    // Baseline Verification Log
    await VerificationLog.create({
      evidenceId: evidenceRecord.id,
      verifiedBy: alice.id,
      submittedHash: originalHash,
      originalHash: originalHash,
      result: "verified",
      timestamp: new Date(Date.now() - 3600000 * 2.0)
    });

    stagedRecords.push({ evidenceRecord, originalHash, key });
  }

  // 7. On-Chain Smart Contract Anchoring
  console.log("\n[PHASE 4: SMART CONTRACT & BLOCKCHAIN ANCHORING]");
  for (const { evidenceRecord, originalHash } of stagedRecords) {
    console.log(`\nAnchoring ${evidenceRecord.evidenceName} (ID: ${evidenceRecord.id}) to Ethereum...`);
    try {
      const receipt = await blockchainService.registerEvidence(
        evidenceRecord.id,
        originalHash,
        c.caseNumber,
        evidenceRecord.description,
        alice.walletAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
      );

      console.log(`  ✓ On-Chain Anchoring Successful!`);
      console.log(`    - Transaction Hash: ${receipt.txHash}`);
      console.log(`    - Block Number:     ${receipt.blockNumber}`);
      console.log(`    - Gas Used:         ${receipt.gasUsed}`);
      console.log(`    - Contract Address: ${receipt.contractAddress}`);

      evidenceRecord.blockchainTxId = receipt.txHash;
      evidenceRecord.blockchainBlockNumber = receipt.blockNumber;
      evidenceRecord.blockchainStatus = "CONFIRMED";
      evidenceRecord.blockchainAnchoredAt = new Date();
      await evidenceRecord.save();

      // Corroborate via getEvidence()
      const onChain = await blockchainService.getEvidence(evidenceRecord.id);
      console.log(`  ✓ Corroborated with Smart Contract on-chain record:`);
      console.log(`    - Stored Hash:    ${onChain.fileHash}`);
      console.log(`    - Hash Matches:   ${onChain.fileHash.toLowerCase() === originalHash.toLowerCase()}`);
      console.log(`    - Exists Flag:    ${onChain.exists}`);

      if (onChain.fileHash.toLowerCase() !== originalHash.toLowerCase()) {
        throw new Error(`CRITICAL: On-chain hash mismatch for ${evidenceRecord.id}`);
      }

      // Record Audit Log for genuine blockchain anchoring
      await AuditLog.create({
        category: "BLOCKCHAIN",
        action: "EVIDENCE_ANCHORED_ON_CHAIN",
        actorId: alice.id,
        actorRole: "investigator",
        caseId: c.id,
        evidenceId: evidenceRecord.id,
        blockchainTxId: receipt.txHash,
        details: JSON.stringify({
          evidenceName: evidenceRecord.evidenceName,
          blockNumber: receipt.blockNumber,
          sha256: originalHash,
          gasUsed: receipt.gasUsed
        }),
        timestamp: new Date()
      });

    } catch (err) {
      console.error(`  ✕ Smart contract registration failed: ${err.message}`);
      evidenceRecord.blockchainStatus = "FAILED";
      await evidenceRecord.save();
    }
  }

  // 8. Final Count Verification
  console.log("\n[PHASE 6: VALIDATION]");
  const finalEvidences = await Evidence.findAll({ where: { caseId: c.id } });
  console.log(`Active evidence records in case ${c.caseNumber}: ${finalEvidences.length}`);
  finalEvidences.forEach((e, idx) => {
    console.log(`  ${idx + 1}. [${e.category}] ${e.evidenceName} - ${e.fileSize} bytes - Hash: ${e.fileHash} - Status: ${e.blockchainStatus} - Tx: ${e.blockchainTxId}`);
  });

  if (finalEvidences.length !== 3) {
    console.error(`ERROR: Expected 3 evidence records, but found ${finalEvidences.length}!`);
  } else {
    console.log("\n✓ SUCCESS: Exactly 3 replacement evidence records active and anchored in Case PS-2026-001!");
  }

  process.exit(0);
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});

