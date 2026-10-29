const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load Environment Variables
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// Human Readable ABI as a fallback
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
    provider = new ethers.JsonRpcProvider(RPC_URL);
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
    const tx = await contract.registerEvidence(evidenceId, fileHash, caseId, metadata, submitterAddress);
    console.log(`Transaction sent. Hash: ${tx.hash}. Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    return receipt.hash;
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
    const tx = await contract.transferCustody(evidenceId, newCustodianAddress, currentCustodianAddress);
    console.log(`Transaction sent. Hash: ${tx.hash}. Waiting for confirmation...`);

    const receipt = await tx.wait();
    console.log(`Custody transfer confirmed in block ${receipt.blockNumber}`);
    return receipt.hash;
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

module.exports = {
  registerEvidence,
  transferCustody,
  verifyEvidence,
  getEvidence,
  getCustodyHistory,
  initBlockchain
};
