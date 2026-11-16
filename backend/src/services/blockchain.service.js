const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load Environment Variables
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

let isAutoDeploying = false;

/**
 * Automatically deploys ProofShieldEvidence contract if missing from active chain,
 * updates .env, and anchors any unanchored database evidence records.
 */
async function deploySmartContract() {
  if (isAutoDeploying) {
    console.log("[BLOCKCHAIN AUTO-DEPLOY] Deployment already in progress. Waiting...");
    return null;
  }
  isAutoDeploying = true;
  try {
    if (!provider) initBlockchain();
    if (!provider || !wallet) {
      throw new Error("Cannot deploy contract: provider or wallet not initialized.");
    }

    const artifactPath = path.join(__dirname, "../../../blockchain/artifacts/contracts/ProofShieldEvidence.sol/ProofShieldEvidence.json");
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Contract artifact not found at ${artifactPath}`);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    console.log("[BLOCKCHAIN AUTO-DEPLOY] Deploying ProofShieldEvidence to active chain...");

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const deployed = await factory.deploy();
    await deployed.waitForDeployment();
    const newAddress = await deployed.getAddress();

    console.log(`[BLOCKCHAIN AUTO-DEPLOY] ProofShieldEvidence deployed at: ${newAddress}`);

    // Auto-update root .env file
    const envPath = path.join(__dirname, "../../../.env");
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, "utf8");
      if (envContent.includes("CONTRACT_ADDRESS=")) {
        envContent = envContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${newAddress}`);
      } else {
        envContent += `\nCONTRACT_ADDRESS=${newAddress}`;
      }
      fs.writeFileSync(envPath, envContent, "utf8");
      console.log(`[BLOCKCHAIN AUTO-DEPLOY] Updated CONTRACT_ADDRESS in root .env to ${newAddress}`);
    }

    // Update in-memory references
    process.env.CONTRACT_ADDRESS = newAddress;
    contract = new ethers.Contract(newAddress, artifact.abi, wallet);

    // Synchronize and anchor database exhibits
    try {
      const { Evidence, Case, User } = require("../models");
      const exhibits = await Evidence.findAll({
        include: [{ model: Case, as: "case" }, { model: User, as: "submitter" }]
      });
      console.log(`[BLOCKCHAIN AUTO-DEPLOY] Anchoring ${exhibits.length} exhibits on-chain...`);
      for (const ev of exhibits) {
        try {
          const nonce = await provider.getTransactionCount(wallet.address, "latest");
          const submitterAddr = ev.submitter?.walletAddress || wallet.address;
          const tx = await contract.registerEvidence(
            ev.id,
            ev.fileHash,
            ev.case?.caseNumber || "PS-2026-001",
            ev.description || "Forensic Exhibit",
            submitterAddr,
            { nonce }
          );
          const receipt = await tx.wait();
          ev.blockchainTxId = receipt.hash;
          ev.blockchainBlockNumber = receipt.blockNumber;
          ev.blockchainStatus = "CONFIRMED";
          ev.blockchainContractAddress = newAddress;
          ev.blockchainAnchoredAt = new Date();
          await ev.save();
          console.log(`  -> Anchored exhibit ${ev.evidenceName} (Block #${receipt.blockNumber})`);
        } catch (anchorErr) {
          console.warn(`  -> Could not anchor exhibit ${ev.id}:`, anchorErr.message);
        }
      }
    } catch (dbErr) {
      console.warn("[BLOCKCHAIN AUTO-DEPLOY] Exhibit sync warning:", dbErr.message);
    }

    return newAddress;
  } catch (err) {
    console.error("[BLOCKCHAIN AUTO-DEPLOY] Deployment error:", err.message);
    throw err;
  } finally {
    isAutoDeploying = false;
  }
}
const HUMAN_READABLE_ABI = [
  "function registerEvidence(string _evidenceId, string _fileHash, string _caseId, string _metadata, address _submitter) external",
  "function transferCustody(string _evidenceId, address _newCustodian, address _currentCustodian) external",
  "function verifyEvidence(string _evidenceId, string _fileHash) external view returns (bool isVerified, string registeredHash)",
  "function getEvidence(string _evidenceId) external view returns (string evidenceId, string fileHash, string caseId, string metadata, address submitter, uint256 timestamp, address currentCustodian, bool exists)",
  "function getCustodyHistory(string _evidenceId) external view returns (tuple(address actor, string action, address previousCustodian, address newCustodian, uint256 timestamp)[])"
];

// Helper to get contract ABI from compilation or fallback
function getABI() {
  const artifactPath = path.join(__dirname, "../../../blockchain/artifacts/contracts/ProofShieldEvidence.sol/ProofShieldEvidence.json");
  if (fs.existsSync(artifactPath)) {
    try {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      return artifact.abi;
    } catch (e) {
      console.warn("Could not parse compiled ABI JSON, falling back to human-readable ABI.");
    }
  }
  return HUMAN_READABLE_ABI;
}

let provider;
let wallet;
let contract;

function initBlockchain() {
  if (!CONTRACT_ADDRESS) {
    console.warn("WARNING: CONTRACT_ADDRESS is not set in .env! Smart contract transactions will fail or fall back.");
    return false;
  }
  
  try {
    const staticNetwork = ethers.Network.from({
      chainId: 1337,
      name: "hardhat"
    });
    provider = new ethers.JsonRpcProvider(RPC_URL, staticNetwork, { staticNetwork: true, cacheTimeout: -1 });
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    contract = new ethers.Contract(CONTRACT_ADDRESS, getABI(), wallet);
    console.log(`Connected to blockchain node: ${RPC_URL} and contract address: ${CONTRACT_ADDRESS}`);
    return true;
  } catch (err) {
    console.error("Failed to initialize blockchain connection:", err.message);
    return false;
  }
}

// Initialize on service load
initBlockchain();

/**
 * Retrieves reliable network and deployment identity:
 * - Chain ID
 * - Contract Address
 * - Genesis Block Hash (identifies chain instance across resets)
 * - Current Block Height
 * - Contract Deployment Verification
 */
async function getNetworkIdentity() {
  if (!provider) {
    initBlockchain();
  }
  if (!provider) return null;
  try {
    const network = await provider.getNetwork();
    const [block0, currentBlock, code] = await Promise.all([
      provider.getBlock(0).catch(() => null),
      provider.getBlockNumber().catch(() => null),
      provider.getCode(CONTRACT_ADDRESS).catch(() => null)
    ]);

    return {
      chainId: Number(network.chainId),
      contractAddress: CONTRACT_ADDRESS,
      genesisHash: block0 ? block0.hash : null,
      currentBlock,
      isDeployed: code && code !== "0x" && code !== "0x0"
    };
  } catch (err) {
    console.warn("Could not query network identity:", err.message);
    return null;
  }
}

/**
 * Registers evidence hash on blockchain.
 */
async function registerEvidence(evidenceId, fileHash, caseId, metadata, submitterAddress) {
  if (!contract) {
    // Re-attempt init
    if (!initBlockchain()) {
      throw new Error("Blockchain service not initialized. Check your CONTRACT_ADDRESS and RPC node.");
    }
  }
  
  try {
    console.log(`Submitting registration for ${evidenceId} to blockchain...`);

    // Add a 15-second safety timeout so unresponsive nodes or network drops don't hang the upload pipeline
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Blockchain transaction timed out after 15 seconds. Node may be offline or unresponsive.")), 15000);
    });

    const executionPromise = (async () => {
      const currentNonce = await provider.getTransactionCount(wallet.address, "latest");
      const tx = await contract.registerEvidence(evidenceId, fileHash, caseId, metadata, submitterAddress, { nonce: currentNonce });
      console.log(`Transaction sent. Hash: ${tx.hash}. Waiting for confirmation...`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      return receipt;
    })();

    const receipt = await Promise.race([executionPromise, timeoutPromise]);

    let netIdentity = null;
    try {
      netIdentity = await getNetworkIdentity();
    } catch (e) {
      // Ignore network identity error
    }

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : null,
      chainId: netIdentity?.chainId || 1337,
      contractAddress: CONTRACT_ADDRESS,
      genesisHash: netIdentity?.genesisHash || null
    };
  } catch (error) {
    console.error("Blockchain registration failed:", error);
    throw error;
  }
}

/**
 * Transfers evidence custody on blockchain.
 */
async function transferCustody(evidenceId, newCustodianAddress, currentCustodianAddress) {
  if (!contract) {
    if (!initBlockchain()) {
      throw new Error("Blockchain service not initialized.");
    }
  }

  try {
    console.log(`Submitting custody transfer for ${evidenceId} to ${newCustodianAddress} on blockchain...`);
    const currentNonce = await provider.getTransactionCount(wallet.address, "latest");
    const tx = await contract.transferCustody(evidenceId, newCustodianAddress, currentCustodianAddress, { nonce: currentNonce });
    console.log(`Transaction sent. Hash: ${tx.hash}. Waiting for confirmation...`);

    const receipt = await tx.wait();
    console.log(`Custody transfer confirmed in block ${receipt.blockNumber}`);
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : null
    };
  } catch (error) {
    console.error("Blockchain custody transfer failed:", error);
    throw error;
  }
}

/**
 * Verifies evidence hash on blockchain.
 * Returns { isVerified: boolean, registeredHash: string }
 */
async function verifyEvidence(evidenceId, fileHash) {
  if (!contract) {
    if (!initBlockchain()) {
      throw new Error("Blockchain service not initialized.");
    }
  }

  try {
    console.log(`Reading verification state for ${evidenceId} from blockchain...`);
    const [isVerified, registeredHash] = await contract.verifyEvidence(evidenceId, fileHash);
    return { isVerified, registeredHash };
  } catch (error) {
    console.error("Blockchain verification failed:", error);
    throw error;
  }
}

/**
 * Gets evidence details from blockchain.
 */
async function getEvidence(evidenceId) {
  if (!contract) {
    if (!initBlockchain()) {
      throw new Error("Blockchain service not initialized.");
    }
  }

  try {
    const result = await contract.getEvidence(evidenceId);
    return {
      evidenceId: result[0],
      fileHash: result[1],
      caseId: result[2],
      metadata: result[3],
      submitter: result[4],
      timestamp: Number(result[5]) * 1000, // to millisecond timestamp
      currentCustodian: result[6],
      exists: result[7]
    };
  } catch (error) {
    console.error(`Blockchain getEvidence failed for ${evidenceId}:`, error);
    throw error;
  }
}

/**
 * Gets custody history from blockchain.
 */
async function getCustodyHistory(evidenceId) {
  if (!contract) {
    if (!initBlockchain()) {
      throw new Error("Blockchain service not initialized.");
    }
  }

  try {
    const history = await contract.getCustodyHistory(evidenceId);
    return history.map((event) => ({
      actor: event.actor,
      action: event.action,
      previousCustodian: event.previousCustodian,
      newCustodian: event.newCustodian,
      timestamp: Number(event.timestamp) * 1000,
    }));
  } catch (error) {
    console.error(`Blockchain getCustodyHistory failed for ${evidenceId}:`, error);
    throw error;
  }
}

/**
 * Diagnostics & Health check helper:
 * Accurately determines:
 * 1. NODE_UNAVAILABLE: JSON-RPC connection or provider request fails
 * 2. CONTRACT_UNAVAILABLE: Contract cannot be accessed at address
 * 3. RECORD_NOT_ANCHORED_ON_CHAIN: Node & contract operational, but evidence was never anchored
 * 4. RECORD_PREVIOUS_CHAIN_UNVERIFIABLE: Node & contract operational, but evidence was anchored on a previous chain instance / deployment and is missing on active chain (Chain reset detected)
 * 5. RECORD_CONFIRMED_ON_CHAIN: Evidence exists on active chain and record is verified
 */
async function checkEvidenceOnChainStatus(evidenceId, dbEvidence = null) {
  if (!provider || !contract) {
    initBlockchain();
  }

  // 1. Check Node connectivity
  let currentBlock = null;
  let networkIdentity = null;
  try {
    currentBlock = await provider.getBlockNumber();
    networkIdentity = await getNetworkIdentity();
  } catch (nodeErr) {
    return {
      nodeStatus: "NODE_UNAVAILABLE",
      contractStatus: "UNAVAILABLE",
      recordStatus: "NODE_UNAVAILABLE",
      currentBlock: null,
      error: "Ethereum JSON-RPC node is unreachable at " + RPC_URL
    };
  }

  // 2. Check Contract deployment & accessibility
  if (!CONTRACT_ADDRESS) {
    return {
      nodeStatus: "OPERATIONAL",
      contractStatus: "CONTRACT_NOT_DEPLOYED",
      recordStatus: "CONTRACT_NOT_DEPLOYED",
      currentBlock,
      networkIdentity,
      error: "CONTRACT_ADDRESS is not configured in environment variables."
    };
  }

  try {
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (!code || code === "0x" || code === "0x0") {
      return {
        nodeStatus: "OPERATIONAL",
        contractStatus: "CONTRACT_NOT_DEPLOYED",
        recordStatus: "CONTRACT_NOT_DEPLOYED",
        currentBlock,
        networkIdentity,
        error: "ProofShieldEvidence contract bytecode is missing at " + CONTRACT_ADDRESS + ". Deploy the contract on this chain instance."
      };
    }

    await contract.owner();
  } catch (contractErr) {
    return {
      nodeStatus: "OPERATIONAL",
      contractStatus: "CONTRACT_UNAVAILABLE",
      recordStatus: "CONTRACT_UNAVAILABLE",
      currentBlock,
      networkIdentity,
      error: "ProofShieldEvidence contract call failed at " + CONTRACT_ADDRESS + ": " + contractErr.message
    };
  }

  // 3. Check Evidence on-chain presence
  try {
    const result = await contract.getEvidence(evidenceId);
    
    // Check if receipt exists on current chain when dbEvidence has a txId
    let isTxReceiptFound = true;
    if (dbEvidence && dbEvidence.blockchainTxId) {
      try {
        const rc = await provider.getTransactionReceipt(dbEvidence.blockchainTxId);
        if (!rc) isTxReceiptFound = false;
      } catch (e) {
        isTxReceiptFound = false;
      }
    }

    return {
      nodeStatus: "OPERATIONAL",
      contractStatus: "OPERATIONAL",
      recordStatus: "RECORD_CONFIRMED_ON_CHAIN",
      currentBlock,
      networkIdentity,
      isTxReceiptFound,
      data: {
        evidenceId: result[0],
        fileHash: result[1],
        caseId: result[2],
        metadata: result[3],
        submitter: result[4],
        timestamp: Number(result[5]) * 1000,
        currentCustodian: result[6],
        exists: result[7]
      }
    };
  } catch (revertErr) {
    // Contract reverted: Evidence does not exist on the current active contract!
    
    // Detect if this evidence was previously anchored on an older chain instance
    const wasPreviouslyAnchored = dbEvidence && (
      Boolean(dbEvidence.blockchainTxId) ||
      dbEvidence.blockchainStatus === "CONFIRMED" ||
      dbEvidence.blockchainStatus === "PREVIOUS_CHAIN"
    );

    if (wasPreviouslyAnchored) {
      return {
        nodeStatus: "OPERATIONAL",
        contractStatus: "OPERATIONAL",
        recordStatus: "RECORD_PREVIOUS_CHAIN_UNVERIFIABLE",
        isStaleChain: true,
        currentBlock,
        networkIdentity,
        previousTxHash: dbEvidence.blockchainTxId,
        previousBlockNumber: dbEvidence.blockchainBlockNumber,
        error: "Evidence was confirmed on a previous blockchain instance (Chain reset detected). The historical transaction and on-chain record are not found on the active network."
      };
    }

    return {
      nodeStatus: "OPERATIONAL",
      contractStatus: "OPERATIONAL",
      recordStatus: "RECORD_NOT_ANCHORED_ON_CHAIN",
      currentBlock,
      networkIdentity,
      error: "Evidence exhibit is registered in ProofShield database but has not been anchored to Ethereum smart contract."
    };
  }
}

/**
 * Authoritative, comprehensive Blockchain and Smart Contract Health Engine
 * Evaluates Node, Bytecode, Owner Accessibility, and Service Status independently.
 */
async function getBlockchainHealth() {
  if (!provider) {
    initBlockchain();
  }

  const nowIso = new Date().toISOString();
  const startTime = Date.now();

  const health = {
    node: {
      status: "UNAVAILABLE",
      rpcUrl: RPC_URL,
      chainId: null,
      blockNumber: null,
      latencyMs: null,
      error: null
    },
    smartContract: {
      status: "UNAVAILABLE", // OPERATIONAL | NOT_DEPLOYED | UNAVAILABLE
      address: CONTRACT_ADDRESS || null,
      isConfigured: Boolean(CONTRACT_ADDRESS),
      hasBytecode: false,
      owner: null,
      latencyMs: null,
      error: null,
      troubleshooting: "Deploy the smart contract via 'npx hardhat run scripts/deploy.js --network localhost'."
    },
    evidenceAnchoring: {
      status: "STANDBY", // OPERATIONAL | DEGRADED | STANDBY
      summary: "Database vault active; pending smart contract connection."
    },
    summaryTitle: "Ethereum Node Offline",
    summaryDescription: "The local Ethereum blockchain node is currently offline at " + RPC_URL + ".",
    label: "Ledger Offline: Standby Redundancy (Port 8545)",
    badgeColor: "red", // emerald | amber | red
    timestamp: nowIso
  };

  if (!provider) {
    health.node.error = "Ethereum provider could not be initialized.";
    return health;
  }

  // 1. Evaluate Ethereum JSON-RPC Node
  try {
    const nodeStart = Date.now();
    const [network, blockNum] = await Promise.all([
      provider.getNetwork(),
      provider.getBlockNumber()
    ]);
    health.node.latencyMs = Date.now() - nodeStart;
    health.node.status = "OPERATIONAL";
    health.node.chainId = Number(network.chainId);
    health.node.blockNumber = blockNum; // Can be 0, 1, 2...
    health.node.error = null;
  } catch (nodeErr) {
    health.node.status = "UNAVAILABLE";
    health.node.error = `Cannot connect to Ethereum node at ${RPC_URL}: ${nodeErr.message}`;
    health.summaryTitle = "Ethereum JSON-RPC Node Offline — Local Vault Protection Active";
    health.summaryDescription = `The Ethereum node at ${RPC_URL} is unreachable. Evidence records remain cryptographically secured in local repository storage with SHA-256 verification.`;
    health.label = "Ledger Offline: Standby Redundancy (Port 8545)";
    health.badgeColor = "red";
    return health;
  }

  // 2. Evaluate Smart Contract Deployment & Accessibility
  if (!CONTRACT_ADDRESS) {
    health.smartContract.status = "NOT_DEPLOYED";
    health.smartContract.error = "CONTRACT_ADDRESS environment variable is not defined in .env.";
    health.summaryTitle = "Smart Contract Not Configured — Node Connected";
    health.summaryDescription = `Ethereum node is operational on Chain ${health.node.chainId} (Block #${health.node.blockNumber}), but no smart contract address is configured.`;
    health.label = `Node Connected (Chain ${health.node.chainId}) • Contract Not Configured`;
    health.badgeColor = "amber";
    return health;
  }

  try {
    let currentContractAddress = process.env.CONTRACT_ADDRESS || CONTRACT_ADDRESS;
    let code = currentContractAddress ? await provider.getCode(currentContractAddress) : "0x";

    // Auto-heal: If Ethereum node is operational on Chain 1337 but contract has no bytecode,
    // automatically deploy the contract, update .env, and anchor database exhibits!
    if (!code || code === "0x" || code === "0x0") {
      console.log(`[BLOCKCHAIN HEALTH] Contract missing bytecode at ${currentContractAddress || "unconfigured"}. Initiating automatic deployment...`);
      try {
        const deployedAddr = await deploySmartContract();
        if (deployedAddr) {
          currentContractAddress = deployedAddr;
          code = await provider.getCode(currentContractAddress);
        }
      } catch (deployErr) {
        console.warn("[BLOCKCHAIN HEALTH] Auto-deploy attempt failed:", deployErr.message);
      }
    }

    if (!code || code === "0x" || code === "0x0") {
      health.smartContract.status = "NOT_DEPLOYED";
      health.smartContract.hasBytecode = false;
      health.smartContract.contractAddress = currentContractAddress;
      health.smartContract.error = `ProofShieldEvidence contract is not deployed at configured address ${currentContractAddress} on active chain instance.`;
      health.summaryTitle = "Smart Contract Not Deployed on Active Chain — Node Connected";
      health.summaryDescription = `Ethereum node is operational on Chain ${health.node.chainId} (Block #${health.node.blockNumber}), but the smart contract has not been deployed on this chain instance yet.`;
      health.label = `Node Connected (Chain ${health.node.chainId}) • Contract Not Deployed`;
      health.badgeColor = "amber";
      health.evidenceAnchoring.status = "STANDBY";
      health.evidenceAnchoring.summary = "Exhibits secured in database repository; deploy contract to enable on-chain anchoring.";
      return health;
    }

    health.smartContract.hasBytecode = true;
    health.smartContract.contractAddress = currentContractAddress;

    // Verify contract readability via owner() call
    const scStart = Date.now();
    const owner = await contract.owner();
    health.smartContract.latencyMs = Date.now() - scStart;
    health.smartContract.owner = owner;
    health.smartContract.status = "OPERATIONAL";
    health.smartContract.error = null;
    health.smartContract.troubleshooting = null;

    health.evidenceAnchoring.status = "OPERATIONAL";
    health.evidenceAnchoring.summary = "ProofShieldEvidence smart contract active. Immutable anchoring available.";

    health.summaryTitle = "All Core Subsystems Fully Functional";
    health.summaryDescription = "Database, Ethereum RPC, smart contract, and cryptographic verification services operating within nominal parameters.";
    health.label = `Ledger Connected: Ethereum Node (Chain ${health.node.chainId})`;
    health.badgeColor = "emerald";
  } catch (contractErr) {
    health.smartContract.status = "UNAVAILABLE";
    health.smartContract.error = `Bytecode exists at ${CONTRACT_ADDRESS}, but smart contract execution failed: ${contractErr.message}`;
    health.summaryTitle = "Smart Contract Call Error — Node Connected";
    health.summaryDescription = `Ethereum node is operational on Chain ${health.node.chainId} (Block #${health.node.blockNumber}), but the smart contract call to owner() reverted.`;
    health.label = `Node Connected (Chain ${health.node.chainId}) • Contract Unavailable`;
    health.badgeColor = "amber";
    health.evidenceAnchoring.status = "STANDBY";
  }

  return health;
}

module.exports = {
  registerEvidence,
  transferCustody,
  verifyEvidence,
  getEvidence,
  getCustodyHistory,
  checkEvidenceOnChainStatus,
  getNetworkIdentity,
  getBlockchainHealth,
  deploySmartContract,
  initBlockchain,
  get provider() { return provider; },
  get wallet() { return wallet; },
  get contract() { return contract; },
  RPC_URL,
  CONTRACT_ADDRESS
};
