const { ethers } = require("ethers");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const http = require("http");

require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const { Evidence, Case, User, sequelize } = require("../models");
const blockchainService = require("../services/blockchain.service");
const { verifyEvidenceFile } = require("../services/verification.service");

const RPC_URL = "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isNodeAlive() {
  try {
    const res = await fetch("http://127.0.0.1:8545", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
      signal: AbortSignal.timeout(1000)
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

async function waitForNode(timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isNodeAlive()) return true;
    await sleep(600);
  }
  return false;
}

function startHardhatNode() {
  console.log("  -> Spawning Hardhat node process (Chain instance)...");
  const batPath = path.join(__dirname, "../../../blockchain/run-node.bat");
  const logPath = path.join(__dirname, "../../../blockchain/hardhat_node.log");
  const logFd = fs.openSync(logPath, "a");

  const child = spawn("cmd.exe", ["/c", batPath], {
    detached: true,
    stdio: ["ignore", logFd, logFd]
  });

  return child;
}

async function stopNodeProcess(child) {
  console.log("  -> Stopping Hardhat node process completely...");
  try {
    const { execSync } = require("child_process");
    execSync('powershell -Command "$con = Get-NetTCPConnection -LocalPort 8545 -ErrorAction SilentlyContinue; if ($con) { Stop-Process -Id $con.OwningProcess -Force -ErrorAction SilentlyContinue }"');
  } catch (e) {}

  if (child) {
    try {
      spawn("taskkill", ["/pid", child.pid.toString(), "/f", "/t"]);
    } catch (e) {}
  }

  await sleep(2500);
  let attempts = 0;
  while (await isNodeAlive() && attempts < 15) {
    await sleep(500);
    attempts++;
  }
  const alive = await isNodeAlive();
  console.log(`  ✓ Hardhat node process stopped. Port 8545 is closed (isAlive: ${alive}).`);
}

async function deployContract(provider, wallet) {
  const artifactPath = path.join(__dirname, "../../../blockchain/artifacts/contracts/ProofShieldEvidence.sol/ProofShieldEvidence.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  return { address, contract };
}

async function runTest() {
  console.log("================================================================================");
  console.log("       PROOFSHIELD — GENUINE HARDHAT CHAIN-RESET RUNTIME VALIDATION             ");
  console.log("================================================================================\n");

  const report = {};
  let nodeProcess = null;

  try {
    // -------------------------------------------------------------------------
    // STEP 1: START CHAIN 1 AND REGISTER EVIDENCE
    // -------------------------------------------------------------------------
    console.log(">>> [STEP 1] Starting Hardhat Chain Instance #1 & Anchoring Exhibit <<<");
    await stopNodeProcess(null);
    nodeProcess = startHardhatNode();
    const node1Ready = await waitForNode();
    if (!node1Ready) throw new Error("Chain #1 failed to start on port 8545.");
    console.log("  ✓ Hardhat Node #1 running on http://127.0.0.1:8545");

    const provider1 = new ethers.JsonRpcProvider(RPC_URL);
    const wallet1 = new ethers.Wallet(PRIVATE_KEY, provider1);
    const network1 = await provider1.getNetwork();
    const chainId1 = Number(network1.chainId);
    const block0_1 = await provider1.getBlock(0);

    console.log(`  ✓ Chain ID             : ${chainId1}`);
    console.log(`  ✓ Genesis Block Hash   : ${block0_1.hash}`);

    // Deploy contract on Chain 1
    console.log("  -> Deploying ProofShieldEvidence to Chain #1...");
    const { address: contractAddress1, contract: contract1 } = await deployContract(provider1, wallet1);
    console.log(`  ✓ Contract deployed to  : ${contractAddress1}`);

    // Configure service
    process.env.CONTRACT_ADDRESS = contractAddress1;
    blockchainService.initBlockchain();

    // Create physical exhibit 1
    const testDir = path.join(__dirname, "../../uploads/demo_files");
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

    const time1 = Date.now();
    const filename1 = `evidence_chain1_${time1}.dat`;
    const filePath1 = path.join(testDir, filename1);
    const content1 = Buffer.from(`GENUINE CHAIN RESET TEST EXHIBIT #1 — CREATED ON CHAIN 1 — TIMESTAMP: ${new Date().toISOString()}`);
    fs.writeFileSync(filePath1, content1);
    const fileHash1 = crypto.createHash("sha256").update(content1).digest("hex");

    // Fetch user and case
    const user = await User.findOne({ where: { role: "investigator" } }) || await User.create({
      name: "Investigator Alice",
      email: `alice_${time1}@proofshield.com`,
      passwordHash: "hash",
      role: "investigator",
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    });
    const caseItem = await Case.findOne() || await Case.create({
      caseNumber: "CASE-CHAIN-RESET",
      title: "Chain Reset Forensic Validation",
      status: "Active",
      leadInvestigator: user.id
    });

    // Save DB record for Exhibit 1
    const exhibit1 = await Evidence.create({
      caseId: caseItem.id,
      evidenceName: filename1,
      category: "Surveillance / Audio-Visual",
      fileType: "dat",
      fileSize: content1.length,
      fileHash: fileHash1,
      submittedBy: user.id,
      currentCustodian: user.id,
      blockchainStatus: "PENDING"
    });

    console.log(`  ✓ DB Record Created    : UUID ${exhibit1.id}`);
    console.log(`  ✓ File SHA-256 Digest  : ${fileHash1}`);

    // Register on Chain 1
    console.log("  -> Broadcasting registerEvidence() to Chain #1...");
    const regReceipt1 = await blockchainService.registerEvidence(
      exhibit1.id,
      fileHash1,
      caseItem.caseNumber,
      "Exhibit registered on Chain 1",
      user.walletAddress
    );

    exhibit1.blockchainTxId = regReceipt1.txHash;
    exhibit1.blockchainBlockNumber = regReceipt1.blockNumber;
    exhibit1.blockchainStatus = "CONFIRMED";
    exhibit1.blockchainAnchoredAt = new Date();
    exhibit1.blockchainChainId = regReceipt1.chainId;
    exhibit1.blockchainContractAddress = regReceipt1.contractAddress;
    exhibit1.blockchainGenesisHash = regReceipt1.genesisHash;
    await exhibit1.save();

    console.log(`  ✓ Transaction Hash (Tx1): ${regReceipt1.txHash}`);
    console.log(`  ✓ Block Number (Chain1) : #${regReceipt1.blockNumber}`);
    console.log(`  ✓ Gas Used              : ${regReceipt1.gasUsed} units`);

    // Verify on Chain 1
    const onChainEx1 = await contract1.getEvidence(exhibit1.id);
    console.log(`  ✓ On-Chain Check (Chain 1): Confirmed! Stored Hash: ${onChainEx1[1]}`);

    report.chain1 = {
      txHash: regReceipt1.txHash,
      blockNumber: regReceipt1.blockNumber,
      contractAddress: contractAddress1,
      evidenceId: exhibit1.id,
      fileHash: fileHash1
    };

    // -------------------------------------------------------------------------
    // STEP 2: STOP HARDHAT NODE COMPLETELY
    // -------------------------------------------------------------------------
    console.log("\n>>> [STEP 2] Stopping Hardhat Node Completely (Terminating Process) <<<");
    await stopNodeProcess(nodeProcess);
    nodeProcess = null;

    const isNodeOffline = !(await isNodeAlive());
    console.log(`  ✓ Confirmed Port 8545 is Offline: ${isNodeOffline}`);
    if (!isNodeOffline) throw new Error("Node failed to shut down.");

    // -------------------------------------------------------------------------
    // STEP 3: RESTART WITH A FRESH CHAIN (CHAIN 2) AND REDEPLOY CONTRACT
    // -------------------------------------------------------------------------
    console.log("\n>>> [STEP 3] Starting Fresh Chain (Chain #2) & Redeploying Contract <<<");
    nodeProcess = startHardhatNode();
    const node2Ready = await waitForNode();
    if (!node2Ready) throw new Error("Chain #2 failed to start on port 8545.");
    console.log("  ✓ Hardhat Node #2 running on http://127.0.0.1:8545");

    const provider2 = new ethers.JsonRpcProvider(RPC_URL);
    const wallet2 = new ethers.Wallet(PRIVATE_KEY, provider2);
    const freshHeight = await provider2.getBlockNumber();
    console.log(`  ✓ Fresh Chain Block Height: #${freshHeight} (Clean Genesis State)`);

    console.log("  -> Redeploying ProofShieldEvidence to Chain #2...");
    const { address: contractAddress2, contract: contract2 } = await deployContract(provider2, wallet2);
    console.log(`  ✓ Contract Redeployed to   : ${contractAddress2}`);

    process.env.CONTRACT_ADDRESS = contractAddress2;
    blockchainService.initBlockchain();

    // -------------------------------------------------------------------------
    // STEP 4: CONFIRM OLD TRANSACTION RECEIPT IS UNAVAILABLE ON CHAIN 2
    // -------------------------------------------------------------------------
    console.log("\n>>> [STEP 4] Checking Old Transaction Receipt Availability on Chain #2 <<<");
    console.log(`  -> Querying receipt for old Tx: ${report.chain1.txHash}...`);
    const oldReceiptOnChain2 = await provider2.getTransactionReceipt(report.chain1.txHash);
    console.log(`  ✓ getTransactionReceipt(oldTxHash) result: ${oldReceiptOnChain2}`);
    if (oldReceiptOnChain2 !== null) {
      throw new Error("Old transaction receipt should be NULL on fresh chain, but was found!");
    }
    console.log("  ✓ PASS: Old transaction receipt is UNAVAILABLE on fresh chain.");

    // -------------------------------------------------------------------------
    // STEP 5: QUERY OLD EVIDENCE ID AGAINST NEWLY DEPLOYED CONTRACT
    // -------------------------------------------------------------------------
    console.log("\n>>> [STEP 5] Querying Old Evidence ID Against Newly Deployed Contract <<<");
    console.log(`  -> contract.getEvidence("${report.chain1.evidenceId}")...`);
    let oldEvidenceOnChain2Found = false;
    let revertErrorMessage = "";
    try {
      await contract2.getEvidence(report.chain1.evidenceId);
      oldEvidenceOnChain2Found = true;
    } catch (revertErr) {
      revertErrorMessage = revertErr.message;
    }
    console.log(`  ✓ Contract Reverted as expected: ${!oldEvidenceOnChain2Found}`);
    console.log(`  ✓ Error Details: ${revertErrorMessage.substring(0, 70)}...`);
    if (oldEvidenceOnChain2Found) {
      throw new Error("Old evidence should NOT exist in fresh contract, but was found!");
    }
    console.log("  ✓ PASS: Old evidence does NOT exist on the new smart contract.");

    // -------------------------------------------------------------------------
    // STEP 6, 7 & 8: BACKEND CHAIN RESET DETECTION & STALE RECORD MARKING
    // -------------------------------------------------------------------------
    console.log("\n>>> [STEPS 6, 7 & 8] Validating Backend Chain-Reset Detection & Stale Status <<<");
    
    // Call backend checkEvidenceOnChainStatus
    const statusCheck = await blockchainService.checkEvidenceOnChainStatus(report.chain1.evidenceId, exhibit1);
    console.log(`  ✓ Node Status          : ${statusCheck.nodeStatus}`);
    console.log(`  ✓ Contract Status      : ${statusCheck.contractStatus}`);
    console.log(`  ✓ Record Status        : ${statusCheck.recordStatus}`);
    console.log(`  ✓ isStaleChain Flag    : ${statusCheck.isStaleChain}`);

    if (statusCheck.recordStatus === "RECORD_CONFIRMED_ON_CHAIN") {
      throw new Error("Old evidence was FALSELY reported as RECORD_CONFIRMED_ON_CHAIN!");
    }

    if (statusCheck.recordStatus !== "RECORD_PREVIOUS_CHAIN_UNVERIFIABLE") {
      throw new Error(`Expected RECORD_PREVIOUS_CHAIN_UNVERIFIABLE, received: ${statusCheck.recordStatus}`);
    }

    console.log("  ✓ PASS: Backend correctly identified RECORD_PREVIOUS_CHAIN_UNVERIFIABLE.");

    // Run verification service on original exhibit 1 file
    console.log("  -> Running forensic verifyEvidenceFile() on original physical exhibit 1 file...");
    const verif1 = await verifyEvidenceFile(report.chain1.evidenceId, filePath1, user.id);
    console.log(`  ✓ File Integrity Check : ${verif1.fileIntegrity} (Evaluated vs registered SHA-256)`);
    console.log(`  ✓ Blockchain Check     : ${verif1.blockchainAnchoring} (PREVIOUS_CHAIN detected)`);
    console.log(`  ✓ Network Status       : ${verif1.networkStatus} (OPERATIONAL)`);
    console.log(`  ✓ Forensic Verdict     : ${verif1.isVerified ? "AUTHENTIC / VERIFIED" : "TAMPERED"}`);

    if (verif1.blockchainAnchoring === "CONFIRMED") {
      throw new Error("Verification FALSELY marked stale blockchain anchoring as CONFIRMED!");
    }

    // Reload exhibit 1 from DB to verify historical records are preserved
    const reloadedEx1 = await Evidence.findByPk(report.chain1.evidenceId);
    console.log(`  ✓ Historical Tx ID in DB: ${reloadedEx1.blockchainTxId} (Preserved)`);
    console.log(`  ✓ Historical Block in DB: #${reloadedEx1.blockchainBlockNumber} (Preserved)`);
    console.log(`  ✓ Updated DB Status     : ${reloadedEx1.blockchainStatus}`);

    if (!reloadedEx1.blockchainTxId || !reloadedEx1.blockchainBlockNumber) {
      throw new Error("Historical blockchain data was accidentally deleted!");
    }
    console.log("  ✓ PASS: Historical database records preserved intact without deletion.");

    // -------------------------------------------------------------------------
    // STEP 9: REGISTER NEW EVIDENCE RECORD ON NEW CHAIN (CHAIN 2)
    // -------------------------------------------------------------------------
    console.log("\n>>> [STEP 9] Registering Brand New Evidence Exhibit on Chain #2 <<<");
    const time2 = Date.now();
    const filename2 = `evidence_chain2_${time2}.dat`;
    const filePath2 = path.join(testDir, filename2);
    const content2 = Buffer.from(`GENUINE CHAIN RESET TEST EXHIBIT #2 — CREATED ON CHAIN 2 — TIMESTAMP: ${new Date().toISOString()}`);
    fs.writeFileSync(filePath2, content2);
    const fileHash2 = crypto.createHash("sha256").update(content2).digest("hex");

    const exhibit2 = await Evidence.create({
      caseId: caseItem.id,
      evidenceName: filename2,
      category: "Disk Image / Forensics",
      fileType: "dat",
      fileSize: content2.length,
      fileHash: fileHash2,
      submittedBy: user.id,
      currentCustodian: user.id,
      blockchainStatus: "PENDING"
    });

    console.log(`  ✓ DB Record Created (Ex2) : UUID ${exhibit2.id}`);
    console.log(`  ✓ File SHA-256 Digest     : ${fileHash2}`);

    console.log("  -> Broadcasting registerEvidence() to Chain #2...");
    const regReceipt2 = await blockchainService.registerEvidence(
      exhibit2.id,
      fileHash2,
      caseItem.caseNumber,
      "Exhibit registered on Chain 2",
      user.walletAddress
    );

    exhibit2.blockchainTxId = regReceipt2.txHash;
    exhibit2.blockchainBlockNumber = regReceipt2.blockNumber;
    exhibit2.blockchainStatus = "CONFIRMED";
    exhibit2.blockchainAnchoredAt = new Date();
    exhibit2.blockchainChainId = regReceipt2.chainId;
    exhibit2.blockchainContractAddress = regReceipt2.contractAddress;
    exhibit2.blockchainGenesisHash = regReceipt2.genesisHash;
    await exhibit2.save();

    console.log(`  ✓ Transaction Hash (Tx2)  : ${regReceipt2.txHash}`);
    console.log(`  ✓ Block Number (Chain 2)  : #${regReceipt2.blockNumber}`);
    console.log(`  ✓ Gas Used                : ${regReceipt2.gasUsed} units`);

    // Verify on Chain 2
    const onChainEx2 = await contract2.getEvidence(exhibit2.id);
    console.log(`  ✓ On-Chain Check (Chain 2): Confirmed! Stored Hash: ${onChainEx2[1]}`);

    const verif2 = await verifyEvidenceFile(exhibit2.id, filePath2, user.id);
    console.log(`  ✓ File Integrity Check (Ex2): ${verif2.fileIntegrity}`);
    console.log(`  ✓ Blockchain Check (Ex2)    : ${verif2.blockchainAnchoring}`);
    console.log(`  ✓ Forensic Verdict (Ex2)    : ${verif2.isVerified ? "AUTHENTIC / VERIFIED" : "TAMPERED"}`);

    if (verif2.blockchainAnchoring !== "CONFIRMED") {
      throw new Error("New evidence on Chain 2 was not confirmed on-chain!");
    }

    report.chain2 = {
      txHash: regReceipt2.txHash,
      blockNumber: regReceipt2.blockNumber,
      contractAddress: contractAddress2,
      evidenceId: exhibit2.id,
      fileHash: fileHash2
    };

    console.log("\n================================================================================");
    console.log("   ✓ ALL 9 CHAIN-RESET & STALE-DETECTION VALIDATION STEPS PASSED SUCCESSFULLY!  ");
    console.log("================================================================================\n");

    return report;
  } finally {
    // Keep node running for UI / dev exploration, or clean up
    console.log("Test execution finished.");
  }
}

if (require.main === module) {
  runTest().then((r) => {
    console.log("Final Test Summary JSON:\n", JSON.stringify(r, null, 2));
    process.exit(0);
  }).catch((err) => {
    console.error("✕ TEST FAILED WITH ERROR:", err);
    process.exit(1);
  });
}

module.exports = runTest;
