const { Evidence, sequelize } = require("../models");
const { verifyEvidenceFile } = require("../services/verification.service");
const path = require("path");

const DEMO_DIR = path.join(__dirname, "../../uploads/demo_files");

const testSuite = [
  {
    name: "CCTV Surveillance Video",
    cid: "QmXvideo001",
    originalFile: "evidence_cctv.mp4",
    tamperedFile: "evidence_cctv_tampered.mp4"
  },
  {
    name: "Crime Scene Photograph",
    cid: "QmWimage004",
    originalFile: "crime_scene_photo.jpg",
    tamperedFile: "crime_scene_photo_tampered.jpg"
  },
  {
    name: "Emergency Audio Recording",
    cid: "QmZaudio003",
    originalFile: "dispatch_call.wav",
    tamperedFile: "dispatch_call_tampered.wav"
  },
  {
    name: "Forensic PDF Report",
    cid: "QmYpdf002",
    originalFile: "forensic_report.pdf",
    tamperedFile: "forensic_report_tampered.pdf"
  }
];

async function runE2ETests() {
  console.log("==========================================================================================");
  console.log("PROOFSHIELD PHASE 3 — END-TO-END VERIFICATION & TAMPER DETECTION TEST SUITE (4 CATEGORIES)");
  console.log("==========================================================================================\n");

  const results = [];
  let allPassed = true;

  for (const test of testSuite) {
    console.log(`Auditing Category: ${test.name} (CID: ${test.cid})`);

    const evidence = await Evidence.findOne({ where: { ipfsCid: test.cid } });
    if (!evidence) {
      console.error(`  [ERROR] Evidence item with CID ${test.cid} not found in database!`);
      allPassed = false;
      continue;
    }

    const origPath = path.join(DEMO_DIR, test.originalFile);
    const tampPath = path.join(DEMO_DIR, test.tamperedFile);

    // Test 1: Original file verification (MUST MATCH)
    const origReport = await verifyEvidenceFile(evidence.id, origPath, evidence.submittedBy);
    const origPassed = origReport.isVerified === true && origReport.submittedHash === evidence.fileHash;

    // Test 2: Tampered file verification (MUST FAIL / MISMATCH)
    const tampReport = await verifyEvidenceFile(evidence.id, tampPath, evidence.submittedBy);
    const tampPassed = tampReport.isVerified === false && tampReport.submittedHash !== evidence.fileHash;

    const categoryPassed = origPassed && tampPassed;
    if (!categoryPassed) allPassed = false;

    console.log(`  ✓ Original Upload : [${origPassed ? "PASS" : "FAIL"}] Verified: ${origReport.isVerified} (Hash: ${origReport.submittedHash.substring(0, 16)}...)`);
    console.log(`  ✓ Tampered Upload : [${tampPassed ? "PASS" : "FAIL"}] Verified: ${tampReport.isVerified} (Hash: ${tampReport.submittedHash.substring(0, 16)}...)`);
    console.log(`  ==> Category Verdict: ${categoryPassed ? "100% OPERATIONAL & VERIFIED" : "FAILED"}\n`);

    results.push({
      category: test.name,
      registeredHash: evidence.fileHash,
      originalResult: origReport.isVerified ? "MATCH" : "MISMATCH",
      tamperedResult: tampReport.isVerified ? "MATCH" : "MISMATCH",
      status: categoryPassed ? "PASS" : "FAIL"
    });
  }

  console.log("==========================================================================================");
  console.log("FINAL INTEGRATION SUMMARY TABLE");
  console.log("==========================================================================================");
  console.table(results);

  if (allPassed) {
    console.log("\n>>> ALL 4 EVIDENCE CATEGORIES SUCCESSFULLY PASSED INTEGRITY & TAMPER DETECTION! <<<");
  } else {
    console.error("\n>>> SOME TESTS FAILED! Inspect logs above. <<<");
    process.exit(1);
  }
}

runE2ETests()
  .then(() => sequelize.close())
  .catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
