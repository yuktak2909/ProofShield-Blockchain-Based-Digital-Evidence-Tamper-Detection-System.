const fs = require("fs");
const hashingService = require("./hashing.service");
const blockchainService = require("./blockchain.service");
const { Evidence, VerificationLog, User } = require("../models");
const { logAudit } = require("./audit.service");

/**
 * Verifies an uploaded file against the registered hash on the blockchain & database.
 * Logs the verification attempt and results.
 */
async function verifyEvidenceFile(evidenceId, filePath, userId) {
  try {
    const dbEvidence = await Evidence.findByPk(evidenceId, {
      include: [
        { model: User, as: "submitter", attributes: ["name", "email"] },
        { model: User, as: "custodian", attributes: ["name", "email"] }
      ]
    });
    if (!dbEvidence) {
      throw new Error(`Evidence with ID ${evidenceId} not found in database.`);
    }

    const stat = fs.statSync(filePath);
    const calculatedHash = await hashingService.calculateSHA256(filePath);
    
    // Query blockchain smart contract
    let blockchainResult;
    let isBlockchainWitnessed = false;
    try {
      blockchainResult = await blockchainService.verifyEvidence(evidenceId, calculatedHash);
      isBlockchainWitnessed = true;
    } catch (contractErr) {
      const matches = dbEvidence.fileHash === calculatedHash;
      blockchainResult = {
        isVerified: matches,
        registeredHash: dbEvidence.fileHash
      };
      isBlockchainWitnessed = false;
    }

    const { isVerified, registeredHash } = blockchainResult;
    const resultStatus = isVerified ? "verified" : "tampered";

    // Log the verification attempt in PostgreSQL
    const log = await VerificationLog.create({
      evidenceId,
      verifiedBy: userId,
      submittedHash: calculatedHash,
      originalHash: registeredHash,
      result: resultStatus,
      timestamp: new Date()
    });

    // Write to enterprise audit ledger
    await logAudit({
      category: "EVIDENCE",
      action: isVerified ? "EVIDENCE_VERIFIED_MATCH" : "EVIDENCE_VERIFIED_TAMPER_DETECTED",
      actorId: userId,
      caseId: dbEvidence.caseId,
      evidenceId,
      status: isVerified ? "SUCCESS" : "WARNING",
      details: {
        evidenceName: dbEvidence.evidenceName,
        submittedHash: calculatedHash,
        registeredHash,
        fileSize: stat.size,
        result: resultStatus
      }
    });

    let pHashSimilarity = null;
    if (dbEvidence.fileType.startsWith("image/")) {
      const currentPHash = hashingService.calculatePerceptualHash(filePath, dbEvidence.fileType);
      const originalPHash = hashingService.calculatePerceptualHash(filePath, dbEvidence.fileType);
      const distance = hashingService.getHammingDistance(currentPHash, originalPHash);
      pHashSimilarity = Math.round(((64 - distance) / 64) * 100);
    }

    return {
      verificationId: log.id,
      evidenceId,
      evidenceName: dbEvidence.evidenceName,
      caseId: dbEvidence.caseId,
      originalHash: registeredHash,
      submittedHash: calculatedHash,
      originalSize: Number(dbEvidence.fileSize),
      uploadedSize: stat.size,
      registeredFileType: dbEvidence.fileType,
      result: resultStatus,
      isVerified,
      witnessSource: isBlockchainWitnessed ? "ON_CHAIN_ETHEREUM_SMART_CONTRACT" : "POSTGRESQL_CRYPTOGRAPHIC_REGISTRY",
      isBlockchainWitnessed,
      timestamp: log.timestamp,
      blockchainTxId: dbEvidence.blockchainTxId,
      ipfsCid: dbEvidence.ipfsCid,
      submitter: dbEvidence.submitter,
      currentCustodian: dbEvidence.custodian,
      pHashSimilarity,
      statutoryStandards: {
        technicalVerdict: isVerified 
          ? "INTEGRITY VERIFIED — HASH MATCH (Byte-level mathematical corroboration relative to registered digest)"
          : "INTEGRITY FAILURE — HASH MISMATCH (Cryptographic tampering detected; payload differs from registered record)",
        bharatiyaSakshyaAdhiniyam2023: "Bharatiya Sakshya Adhiniyam, 2023 (BSA Sections 61, 62 & 63): Admissibility of electronic records requires hash verification and supporting certificate by a qualified person.",
        federalRulesOfEvidence: "Federal Rules of Evidence Rule 902(13)/(14): Self-authenticating electronic data requires certification by a qualified forensic examiner."
      }
    };
  } catch (error) {
    console.error(`Verification process failed for ${evidenceId}:`, error);
    throw error;
  }
}

module.exports = {
  verifyEvidenceFile
};
