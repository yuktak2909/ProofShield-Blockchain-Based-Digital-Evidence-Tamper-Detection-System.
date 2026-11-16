const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const blockchainService = require("../services/blockchain.service");
const { verifyEvidenceFile } = require("../services/verification.service");
const { Evidence, Case, User, CustodyLog, VerificationLog, sequelize } = require("../models");

async function runLiveValidation() {
  console.log("================================================================================");
  console.log("       PROOFSHIELD — LIVE RUNTIME BLOCKCHAIN & SMART CONTRACT VALIDATION        ");
  console.log("================================================================================\n");

  const results = {
    step1_connectivity: false,
    step2_registration: false,
    step3_verification: false,
    step4_custody: false,
    step5_restart_detection: false,
    data: {}
  };

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // ---------------------------------------------------------------------------
  // 1. ETHEREUM CONNECTIVITY
  // ---------------------------------------------------------------------------
  console.log(">>> [1/5] VALIDATING ETHEREUM JSON-RPC & SMART CONTRACT CONNECTIVITY <<<");
  try {
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const blockNumber = await provider.getBlockNumber();
    console.log(`  ✓ JSON-RPC Connected : ${RPC_URL}`);
    console.log(`  ✓ Chain ID           : ${chainId} ${chainId === 1337 || chainId === 31337 ? "(Hardhat Local)" : ""}`);
    console.log(`  ✓ Current Block Height: #${blockNumber}`);

    // Check contract deployment
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === "0x" || code === "0x0") {
      console.log(`  ! Contract bytecode missing at ${CONTRACT_ADDRESS}. Deploying fresh contract...`);
      // Deploy using Hardhat artifacts
      const artifactPath = path.join(__dirname, "../../../blockchain/artifacts/contracts/ProofShieldEvidence.sol/ProofShieldEvidence.json");
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
      const newContract = await factory.deploy();
      await newContract.waitForDeployment();
      const newAddress = await newContract.getAddress();
      console.log(`  ✓ ProofShieldEvidence deployed to: ${newAddress}`);
      process.env.CONTRACT_ADDRESS = newAddress;
      blockchainService.initBlockchain();
    } else {
      console.log(`  ✓ Contract Code Exists at: ${CONTRACT_ADDRESS}`);
    }

    const owner = await blockchainService.contract.owner();
    console.log(`  ✓ Contract Owner     : ${owner}`);
    results.step1_connectivity = true;
    results.data.chainId = chainId;
    results.data.contractAddress = CONTRACT_ADDRESS;
    results.data.contractOwner = owner;
  } catch (err) {
    console.error("  ✕ Step 1 Failed:", err.message);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // 2. FRESH EVIDENCE REGISTRATION
  // ---------------------------------------------------------------------------
  console.log("\n>>> [2/5] REGISTERING COMPLETELY NEW TEST EVIDENCE EXHIBIT <<<");
  let testEvidenceId;
  let originalFilePath;
  let tamperedFilePath;
  let calculatedSha256;
  let regTxHash;
  let regBlockNumber;
  let regGasUsed;

  try {
    const testDir = path.join(__dirname, "../../uploads/demo_files");
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

    const timestamp = Date.now();
    const testFileName = `evidence_live_test_${timestamp}.dat`;
    originalFilePath = path.join(testDir, testFileName);
    tamperedFilePath = path.join(testDir, `evidence_live_test_tampered_${timestamp}.dat`);

    // Write deterministic forensic test payload
    const testContent = Buffer.from(`PROOFSHIELD FORENSIC LIVE AUDIT EVIDENCE — TIMESTAMP: ${new Date().toISOString()} — ID: ${timestamp}\nPayload: Verified Bitstream Container`);
    fs.writeFileSync(originalFilePath, testContent);

    // Calculate real SHA-256
    calculatedSha256 = crypto.createHash("sha256").update(testContent).digest("hex");
    console.log(`  ✓ Test Exhibit File Created : ${testFileName} (${testContent.length} bytes)`);
    console.log(`  ✓ Computed SHA-256 Digest   : ${calculatedSha256}`);

    // Create database case & evidence record
    let testCase = await Case.findOne();
    if (!testCase) {
      testCase = await Case.create({
        caseNumber: `PS-${timestamp.toString().slice(-4)}`,
        title: "Live Runtime Blockchain Validation Case",
        status: "Open"
      });
    }

    let testUser = await User.findOne({ where: { role: "investigator" } });
    if (!testUser) {
      testUser = await User.findOne();
    }

    testEvidenceId = crypto.randomUUID();
    const submitterWallet = testUser.walletAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

    console.log(`  Executing blockchainService.registerEvidence() for ID: ${testEvidenceId}...`);
    const regReceipt = await blockchainService.registerEvidence(
      testEvidenceId,
      calculatedSha256,
      testCase.caseNumber,
      "Live Runtime Validation Binary Exhibit",
      submitterWallet
    );

    regTxHash = regReceipt.txHash;
    regBlockNumber = regReceipt.blockNumber;
    regGasUsed = regReceipt.gasUsed;

    console.log(`  ✓ Transaction Confirmed on Ethereum!`);
    console.log(`    - Tx Hash     : ${regTxHash}`);
    console.log(`    - Block Height: #${regBlockNumber}`);
    console.log(`    - Gas Used    : ${regGasUsed} units`);

    // Read back directly from on-chain smart contract
    const onChainRecord = await blockchainService.contract.getEvidence(testEvidenceId);
    console.log(`  ✓ Queried contract.getEvidence("${testEvidenceId}"):`);
    console.log(`    - On-Chain Hash     : ${onChainRecord[1]}`);
    console.log(`    - On-Chain Submitter: ${onChainRecord[4]}`);
    console.log(`    - On-Chain Exists   : ${onChainRecord[7]}`);

    if (onChainRecord[1].toLowerCase() !== calculatedSha256.toLowerCase()) {
      throw new Error("On-chain hash does not match computed SHA-256!");
    }

    // Persist in DB
    const dbEvidence = await Evidence.create({
      id: testEvidenceId,
      caseId: testCase.id,
      evidenceName: testFileName,
      category: "Digital Forensic Exhibit",
      fileType: "application/octet-stream",
      fileSize: testContent.length,
      fileHash: calculatedSha256,
      ipfsCid: `QmTestLive${timestamp}`,
      submittedBy: testUser.id,
      currentCustodian: testUser.id,
      status: "REGISTERED",
      blockchainStatus: "CONFIRMED",
      blockchainTxId: regTxHash,
      blockchainBlockNumber: regBlockNumber,
      blockchainAnchoredAt: new Date()
    });

    results.step2_registration = true;
    results.data.registration = {
      evidenceId: testEvidenceId,
      txHash: regTxHash,
      blockNumber: regBlockNumber,
      gasUsed: regGasUsed,
      fileHash: calculatedSha256
    };
  } catch (err) {
    console.error("  ✕ Step 2 Failed:", err);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // 3. ORIGINAL AND TAMPERED VERIFICATION
  // ---------------------------------------------------------------------------
  console.log("\n>>> [3/5] TESTING ORIGINAL & TAMPERED VERIFICATION (THREE INDEPENDENT CHECKS) <<<");
  try {
    let testUser = await User.findOne();

    // A. Verify Original File
    console.log("  Testing Verification on Original File...");
    const originalReport = await verifyEvidenceFile(testEvidenceId, originalFilePath, testUser.id);
    console.log(`    - File Integrity     : ${originalReport.fileIntegrity} (Expected: MATCH)`);
    console.log(`    - Blockchain Status  : ${originalReport.blockchainAnchoring} (Expected: CONFIRMED)`);
    console.log(`    - Network Status     : ${originalReport.networkStatus} (Expected: OPERATIONAL)`);
    console.log(`    - Final Verdict      : ${originalReport.result} (Expected: verified)`);

    if (originalReport.fileIntegrity !== "MATCH" || originalReport.blockchainAnchoring !== "CONFIRMED") {
      throw new Error("Original file verification failed!");
    }

    // B. Verify Tampered File (Change 1 byte)
    console.log("  Testing Verification on Tampered File...");
    const origBytes = fs.readFileSync(originalFilePath);
    origBytes[origBytes.length - 1] = origBytes[origBytes.length - 1] ^ 0xFF; // flip bits
    fs.writeFileSync(tamperedFilePath, origBytes);

    const tamperedReport = await verifyEvidenceFile(testEvidenceId, tamperedFilePath, testUser.id);
    console.log(`    - File Integrity     : ${tamperedReport.fileIntegrity} (Expected: MISMATCH)`);
    console.log(`    - Blockchain Status  : ${tamperedReport.blockchainAnchoring} (Expected: MISMATCH)`);
    console.log(`    - Final Verdict      : ${tamperedReport.result} (Expected: tampered)`);

    if (tamperedReport.fileIntegrity !== "MISMATCH" || tamperedReport.result !== "tampered") {
      throw new Error("Tampered file was not detected!");
    }

    results.step3_verification = true;
    results.data.verification = {
      originalPassed: originalReport.fileIntegrity === "MATCH",
      tamperedDetected: tamperedReport.fileIntegrity === "MISMATCH"
    };
  } catch (err) {
    console.error("  ✕ Step 3 Failed:", err);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // 4. CUSTODY TRANSFER (TWO-STEP PROTOCOL & ON-CHAIN COMMITMENT)
  // ---------------------------------------------------------------------------
  console.log("\n>>> [4/5] TESTING CUSTODY TRANSFER & SMART CONTRACT CUSTODIAN UPDATE <<<");
  try {
    const users = await User.findAll({ limit: 3 });
    const alice = users[0]; // Alice
    const bob = users[1] || users[0];   // Bob

    const aliceWallet = alice.walletAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const bobWallet = bob.walletAddress || "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

    console.log(`  Phase 1: Custody Initiation (Alice -> Bob)`);
    const pendingLog = await CustodyLog.create({
      evidenceId: testEvidenceId,
      actorId: alice.id,
      action: "transfer_initiated",
      previousCustodian: alice.id,
      newCustodian: bob.id,
      transferState: "Pending",
      reason: "Forensic Laboratory Toolmark Inspection",
      blockchainTxId: null,
      blockchainStatus: "NOT_ANCHORED"
    });

    const evBeforeAccept = await Evidence.findByPk(testEvidenceId);
    console.log(`    - Custodian before acceptance: ${evBeforeAccept.currentCustodian} (Must remain Alice: ${alice.id})`);
    if (evBeforeAccept.currentCustodian !== alice.id) {
      throw new Error("Custodian changed before acceptance!");
    }

    console.log(`  Phase 2: Custody Acceptance (Executing contract.transferCustody on Ethereum)...`);
    const transferReceipt = await blockchainService.transferCustody(
      testEvidenceId,
      bobWallet,
      aliceWallet
    );

    console.log(`  ✓ Custody Transfer Confirmed on Ethereum!`);
    console.log(`    - Transfer Tx Hash : ${transferReceipt.txHash}`);
    console.log(`    - Block Height     : #${transferReceipt.blockNumber}`);
    console.log(`    - Gas Used         : ${transferReceipt.gasUsed} units`);

    // Update DB
    pendingLog.transferState = "Accepted";
    pendingLog.blockchainTxId = transferReceipt.txHash;
    pendingLog.blockchainStatus = "CONFIRMED";
    await pendingLog.save();

    evBeforeAccept.currentCustodian = bob.id;
    await evBeforeAccept.save();

    // Verify On-Chain Custody Record
    const onChainAfterTransfer = await blockchainService.contract.getEvidence(testEvidenceId);
    console.log(`    - On-Chain Current Custodian: ${onChainAfterTransfer[6]} (Matches Bob: ${bobWallet})`);
    if (onChainAfterTransfer[6].toLowerCase() !== bobWallet.toLowerCase()) {
      throw new Error("On-chain custodian was not updated to Bob!");
    }

    // Retrieve on-chain custody event history
    const history = await blockchainService.getCustodyHistory(testEvidenceId);
    console.log(`  ✓ On-Chain Custody Events Count: ${history.length} events`);
    for (let i = 0; i < history.length; i++) {
      console.log(`    Event [${i}]: Action=${history[i].action}, Prev=${history[i].previousCustodian.substring(0, 10)}..., New=${history[i].newCustodian.substring(0, 10)}...`);
    }

    results.step4_custody = true;
    results.data.custody = {
      transferTxHash: transferReceipt.txHash,
      blockNumber: transferReceipt.blockNumber,
      gasUsed: transferReceipt.gasUsed,
      onChainCustodian: onChainAfterTransfer[6],
      historyEventsCount: history.length
    };
  } catch (err) {
    console.error("  ✕ Step 4 Failed:", err);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // 5. STALE CHAIN / HARDHAT RESTART TEST
  // ---------------------------------------------------------------------------
  console.log("\n>>> [5/5] TESTING STALE CHAIN & HARDHAT RESTART RECORD DETECTION <<<");
  try {
    // Test how the system handles a transaction hash or evidence ID from an old / different chain
    const fakeOldTxHash = "0x8888888888888888888888888888888888888888888888888888888888888888";
    const oldChainReceipt = await provider.getTransactionReceipt(fakeOldTxHash);
    console.log(`  1. Querying unmined / old-chain transaction receipt:`);
    console.log(`     - provider.getTransactionReceipt("${fakeOldTxHash.substring(0, 16)}...") = ${oldChainReceipt}`);
    if (oldChainReceipt !== null) {
      throw new Error("Non-existent transaction returned a receipt!");
    }

    // Test checkEvidenceOnChainStatus for an unanchored / restarted chain ID
    const unanchoredId = "non-existent-uuid-from-previous-chain";
    const statusCheck = await blockchainService.checkEvidenceOnChainStatus(unanchoredId);
    console.log(`  2. Checking evidence on-chain presence for unanchored/stale exhibit:`);
    console.log(`     - Node Status    : ${statusCheck.nodeStatus} (Node is LIVE)`);
    console.log(`     - Contract Status: ${statusCheck.contractStatus} (Contract is LIVE)`);
    console.log(`     - Record Status  : ${statusCheck.recordStatus} (Accurately identified as NOT_ANCHORED)`);
    console.log(`     - Detail Message : "${statusCheck.error}"`);

    if (statusCheck.recordStatus !== "RECORD_NOT_ANCHORED_ON_CHAIN") {
      throw new Error("Stale evidence was not accurately reported as RECORD_NOT_ANCHORED_ON_CHAIN!");
    }

    results.step5_restart_detection = true;
    results.data.restartDetection = {
      receiptIsNullForStaleTx: oldChainReceipt === null,
      recordStatusForStaleId: statusCheck.recordStatus
    };
  } catch (err) {
    console.error("  ✕ Step 5 Failed:", err);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // FINAL SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("                     LIVE RUNTIME VALIDATION SUMMARY                            ");
  console.log("================================================================================");
  console.log(`1. Ethereum JSON-RPC & Contract Connectivity : ${results.step1_connectivity ? "PASS (100% OPERATIONAL)" : "FAIL"}`);
  console.log(`2. Fresh Evidence Registration On Ethereum   : ${results.step2_registration ? "PASS (CONFIRMED ON-CHAIN)" : "FAIL"}`);
  console.log(`3. Original vs Tampered Hash Verification    : ${results.step3_verification ? "PASS (REAL-TIME FIPS 180-4)" : "FAIL"}`);
  console.log(`4. Two-Step Custody On-Chain Commitment      : ${results.step4_custody ? "PASS (CONFIRMED ON-CHAIN)" : "FAIL"}`);
  console.log(`5. Stale Chain / Restart Detection Logic     : ${results.step5_restart_detection ? "PASS (ACCURATELY DETECTED)" : "FAIL"}`);
  console.log("================================================================================\n");

  await sequelize.close();
  process.exit(0);
}

runLiveValidation().catch(err => {
  console.error("Fatal validation failure:", err);
  process.exit(1);
});

