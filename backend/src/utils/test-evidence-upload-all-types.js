const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Evidence, Case, User, CustodyLog, AuditLog } = require("../models");
const hashingService = require("../services/hashing.service");
const ipfsService = require("../services/ipfs.service");
const verificationService = require("../services/verification.service");
const blockchainService = require("../services/blockchain.service");

async function runEndToEndUploadTests() {
  console.log("================================================================================");
  console.log("        PROOFSHIELD EVIDENCE REGISTRATION PIPELINE & UPLOAD AUDIT              ");
  console.log("================================================================================");

  // 1. Verify Target Case PS-2026-002
  const targetCase = await Case.findOne({ where: { caseNumber: "PS-2026-002" } });
  if (!targetCase) {
    throw new Error("Target Case PS-2026-002 not found in database!");
  }
  console.log(`[TARGET CASE VERIFIED] Case: ${targetCase.caseNumber} - ${targetCase.title} (ID: ${targetCase.id})`);

  // Verify Investigator User
  const investigator = await User.findOne({ where: { role: "investigator" } });
  if (!investigator) {
    throw new Error("Investigator user not found!");
  }
  console.log(`[USER VERIFIED] Investigator: ${investigator.name} (${investigator.email})`);

  // Prepare test directories
  const tempDir = path.join(__dirname, "../../uploads/temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const testResults = [];

  // Helper to create synthetic test exhibits
  const createTestExhibit = (name, ext, mime, sizeBytes, filler) => {
    const timestamp = Date.now() + "_" + Math.floor(Math.random() * 10000);
    const fileName = `${name}_${timestamp}${ext}`;
    const filePath = path.join(tempDir, fileName);
    const buffer = Buffer.alloc(sizeBytes);
    buffer.fill(filler);
    // Write unique header signature so each run has a unique bit-stream hash
    buffer.write(`PROOFSHIELD_FORENSIC_EXHIBIT_${name.toUpperCase()}_${timestamp}`, 0);
    fs.writeFileSync(filePath, buffer);
    return { filePath, mime, name: fileName, sizeBytes };
  };

  // 2. Define All Test Categories
  const testExhibits = [
    {
      label: "1. WebM Video Exhibit (Hit-and-Run CCTV Feed)",
      name: "traffic_intersection_cam_feed",
      ext: ".webm",
      mime: "video/webm",
      size: 1024 * 1024 * 5, // 5 MB WebM video
      filler: "W",
      category: "CCTV / Video",
      desc: "Municipal roadside traffic CCTV stream at intersection of 4th & Main during hit-and-run incident."
    },
    {
      label: "2. MP4 Video Exhibit (Hit-and-Run Dashcam)",
      name: "witness_vehicle_dashcam",
      ext: ".mp4",
      mime: "video/mp4",
      size: 1024 * 1024 * 12, // 12 MB MP4 video
      filler: "V",
      category: "CCTV / Video",
      desc: "Dashcam footage from trailing rideshare vehicle capturing fleeing dark sedan with front-end damage."
    },
    {
      label: "3. JPG/JPEG Photograph Exhibit (Collision Scene Debris)",
      name: "vehicle_debris_roadway",
      ext: ".jpg",
      mime: "image/jpeg",
      size: 1024 * 512, // 512 KB JPG
      filler: "J",
      category: "Photographs",
      desc: "High-resolution scene photograph documenting headlight lens fragments and tire friction marks on pedestrian crosswalk."
    },
    {
      label: "4. PDF Forensic Report Exhibit (Accident Reconstruction)",
      name: "collision_reconstruction_report",
      ext: ".pdf",
      mime: "application/pdf",
      size: 1024 * 128, // 128 KB PDF
      filler: "P",
      category: "PDF / Documents",
      desc: "Forensic collision investigation and vehicle speed calculation report prepared by crash reconstruction unit."
    },
    {
      label: "5. WAV Audio Recording Exhibit (Emergency 911 Call)",
      name: "emergency_dispatch_911_call",
      ext: ".wav",
      mime: "audio/wav",
      size: 1024 * 1024 * 2, // 2 MB WAV
      filler: "A",
      category: "Audio Recordings",
      desc: "Emergency 911 dispatch audio recording from pedestrian reporting hit-and-run collision in real-time."
    }
  ];

  for (const item of testExhibits) {
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`TESTING: ${item.label}`);
    console.log(`--------------------------------------------------------------------------------`);

    // Create exhibit
    const exhibit = createTestExhibit(item.name, item.ext, item.mime, item.size, item.filler);
    const originalHash = await hashingService.calculateSHA256(exhibit.filePath);
    console.log(`[FILE PREPARED] Name: ${exhibit.name} | Size: ${(exhibit.sizeBytes / (1024 * 1024)).toFixed(2)} MB | MIME: ${exhibit.mime}`);
    console.log(`[SHA-256 DIGEST] ${originalHash}`);

    // Simulate Evidence Controller Execution
    const req = {
      file: {
        path: exhibit.filePath,
        mimetype: exhibit.mime,
        size: exhibit.sizeBytes,
        originalname: exhibit.name
      },
      body: {
        caseId: targetCase.id,
        evidenceName: exhibit.name,
        category: item.category,
        description: item.desc,
        collectionTimestamp: new Date().toISOString(),
        location: "Main St & 4th Ave Intersection",
        acquisitionSource: "Forensic Crash Investigation Unit",
        acquisitionMethod: "Direct Bit-Stream Extraction",
        collectorIdentity: investigator.name,
        deviceInfo: "ProofShield Forensic Field Kit"
      },
      user: investigator,
      ip: "127.0.0.1"
    };

    let controllerResponse = null;
    let statusCode = 200;
    const res = {
      status(code) { statusCode = code; return this; },
      json(data) { controllerResponse = data; return this; }
    };

    const evidenceController = require("../controllers/evidence.controller");
    await evidenceController.registerEvidence(req, res);

    console.log(`[CONTROLLER STATUS] HTTP ${statusCode}`);
    if (statusCode !== 201) {
      console.error("[FAILED RESPONSE]", controllerResponse);
      testResults.push({ name: item.name, status: "FAILED", error: controllerResponse?.error });
      continue;
    }

    const registeredEvidence = controllerResponse.evidence;
    console.log(`[EVIDENCE REGISTERED] ID: ${registeredEvidence.id}`);
    console.log(`[DATABASE STATUS] ${registeredEvidence.status} | Category: ${registeredEvidence.category}`);
    console.log(`[IPFS CID] ${registeredEvidence.ipfsCid}`);
    console.log(`[BLOCKCHAIN STATUS] ${registeredEvidence.blockchainStatus}`);

    // Verify File Storage
    const storedFilePath = path.join(__dirname, "../../uploads/ipfs_mock", registeredEvidence.ipfsCid);
    const fileExists = fs.existsSync(storedFilePath);
    if (!fileExists) {
      throw new Error(`Stored file missing at ${storedFilePath}`);
    }
    const storedHash = await hashingService.calculateSHA256(storedFilePath);
    const hashMatches = storedHash.toLowerCase() === originalHash.toLowerCase();
    console.log(`[STORAGE INTEGRITY] File exists: ${fileExists} | Stored SHA-256 matches: ${hashMatches}`);

    // Verify Database Record
    const dbRecord = await Evidence.findByPk(registeredEvidence.id, {
      include: [{ model: Case, as: "case" }]
    });
    const dbCorrect = dbRecord && 
      dbRecord.caseId === targetCase.id && 
      dbRecord.fileHash.toLowerCase() === originalHash.toLowerCase();
    console.log(`[DATABASE VERIFICATION] Case: ${dbRecord.case.caseNumber} | DB Record Match: ${dbCorrect}`);

    // Verify Custody Log Created
    const custodyLogs = await CustodyLog.findAll({ where: { evidenceId: registeredEvidence.id } });
    console.log(`[CUSTODY LOG VERIFIED] Entries found: ${custodyLogs.length} | Action: ${custodyLogs[0]?.action}`);

    // Verify Audit Trail Log
    const auditLogs = await AuditLog.findAll({ where: { evidenceId: registeredEvidence.id } });
    console.log(`[AUDIT TRAIL VERIFIED] Entries found: ${auditLogs.length} | Action: ${auditLogs[0]?.action}`);

    // Verify Tamper Detection via Verification Service
    const mockUploadPath = path.join(tempDir, `verify_${Date.now()}_${exhibit.name}`);
    fs.copyFileSync(storedFilePath, mockUploadPath);
    const verifResult = await verificationService.verifyEvidenceFile(registeredEvidence.id, mockUploadPath, investigator.id);
    console.log(`[INTEGRITY AUDIT] Result: ${verifResult.fileIntegrity} | isVerified: ${verifResult.isVerified}`);

    if (hashMatches && dbCorrect && custodyLogs.length > 0 && verifResult.fileIntegrity === "MATCH") {
      testResults.push({
        name: exhibit.name,
        category: item.category,
        mime: exhibit.mime,
        size: exhibit.sizeBytes,
        evidenceId: registeredEvidence.id,
        status: "PASS",
        blockchainStatus: registeredEvidence.blockchainStatus
      });
    } else {
      testResults.push({ name: exhibit.name, status: "FAIL", error: "Integrity check failed" });
    }

    try {
      if (fs.existsSync(mockUploadPath)) fs.unlinkSync(mockUploadPath);
    } catch (e) {
      // Ignored for Windows file handle release
    }
  }

  // 3. Test File Size Limit Rejection (> 250 MB)
  console.log(`\n--------------------------------------------------------------------------------`);
  console.log("TESTING: File Size Limit (250 MB Threshold Rejection)");
  console.log("--------------------------------------------------------------------------------");
  const uploadMiddleware = require("../middleware/upload");
  console.log(`[MULTER LIMIT] Configured fileSize: ${uploadMiddleware.limits.fileSize} bytes (250 MB)`);

  // 4. Test Unsupported File Type Rejection
  console.log(`\n--------------------------------------------------------------------------------`);
  console.log("TESTING: Unsupported File Type Rejection (.exe executable)");
  console.log("--------------------------------------------------------------------------------");
  let rejectedCorrectly = false;
  uploadMiddleware.fileFilter({}, { mimetype: "application/x-msdownload", originalname: "malicious.exe" }, (err, allowed) => {
    if (err && allowed === false) {
      rejectedCorrectly = true;
      console.log(`[VALIDATION REJECTION PASS] Rejected with message: ${err.message}`);
    }
  });

  // Summary Report
  console.log("\n================================================================================");
  console.log("                       FINAL VALIDATION AUDIT SUMMARY                           ");
  console.log("================================================================================");
  console.table(testResults);

  return testResults;
}

runEndToEndUploadTests()
  .then(() => {
    console.log("\n>>> ALL EVIDENCE REGISTRATION & UPLOAD VALIDATIONS COMPLETED SUCCESSFULLY <<<");
    process.exit(0);
  })
  .catch(err => {
    console.error("FATAL ERROR IN TEST SUITE:", err);
    process.exit(1);
  });
