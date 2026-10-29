const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Fallback directory for local IPFS mock storage
const IPFS_MOCK_DIR = path.join(__dirname, "../../uploads/ipfs_mock");

/**
 * Generates a mock IPFS CID v0 (Qm...) deterministically from a file hash.
 * @param {string} fileHash - SHA-256 hash of the file
 * @returns {string} - Deterministic Qm... CID
 */
function getMockCID(fileHash) {
  // Combine hash with a salt and generate MD5 to fit the length of standard IPFS CIDv0 (46 chars)
  const md5Hash = crypto.createHash("md5").update(fileHash).digest("hex");
  const sha256Snippet = fileHash.substring(0, 28);
  // Base58-like characters
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let mockCid = "Qm";
  
  // Deterministically map our hex components to base58-like characters
  const combinedHex = sha256Snippet + md5Hash;
  for (let i = 0; i < 44; i++) {
    const charCode = combinedHex.charCodeAt(i % combinedHex.length) + i;
    mockCid += alphabet.charAt(charCode % alphabet.length);
  }
  return mockCid;
}

/**
 * Uploads a file to IPFS.
 * Falls back to saving the file locally in development if Pinata credentials are not provided.
 * 
 * @param {string} filePath - Absolute path to the file to upload
 * @param {string} fileHash - SHA-256 hash of the file
 * @returns {Promise<{ cid: string, gatewayUrl: string, isMock: boolean }>}
 */
async function uploadToIPFS(filePath, fileHash) {
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataApiSecret = process.env.PINATA_API_SECRET;
  const pinataJwt = process.env.PINATA_JWT;
  const gatewayBaseUrl = process.env.IPFS_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs/";

  const usePinata = (pinataApiKey && pinataApiSecret) || pinataJwt;

  if (usePinata) {
    console.log("Uploading file to Pinata IPFS service...");
    try {
      // In production, we'd use axios and form-data:
      const axios = require("axios");
      const FormData = require("form-data");
      
      const formData = new FormData();
      formData.append("file", fs.createReadStream(filePath));
      
      const metadata = JSON.stringify({
        name: path.basename(filePath),
        keyvalues: {
          sha256: fileHash
        }
      });
      formData.append("pinataMetadata", metadata);

      let headers = {};
      if (pinataJwt) {
        headers = {
          Authorization: `Bearer ${pinataJwt}`,
          ...formData.getHeaders()
        };
      } else {
        headers = {
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataApiSecret,
          ...formData.getHeaders()
        };
      }

      const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        maxBodyLength: "Infinity",
        headers
      });

      const cid = response.data.IpfsHash;
      return {
        cid,
        gatewayUrl: `${gatewayBaseUrl}${cid}`,
        isMock: false
      };
    } catch (error) {
      console.error("Pinata upload failed. Falling back to local mock storage:", error.message);
      // Fall through to mock storage below
    }
  }

  // Local Mock Storage Fallback
  console.log("IPFS local mock storage fallback triggered.");
  try {
    if (!fs.existsSync(IPFS_MOCK_DIR)) {
      fs.mkdirSync(IPFS_MOCK_DIR, { recursive: true });
    }

    const cid = getMockCID(fileHash);
    const destinationPath = path.join(IPFS_MOCK_DIR, cid);

    // Copy original file to mock IPFS storage folder
    fs.copyFileSync(filePath, destinationPath);
    console.log(`Saved file to mock IPFS directory: ${destinationPath}`);

    return {
      cid,
      gatewayUrl: `/api/evidence/mock-ipfs/${cid}`,
      isMock: true
    };
  } catch (error) {
    console.error("Local mock IPFS storage failed:", error);
    throw new Error("IPFS upload failed: " + error.message);
  }
}

module.exports = {
  uploadToIPFS,
  IPFS_MOCK_DIR
};
