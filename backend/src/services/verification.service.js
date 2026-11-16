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
    
    // -------------------------------------------------------------
    // THREE INDEPENDENT VERIFICATION CHECKS (TASK 5)
    // -------------------------------------------------------------

    // Check A: FILE INTEGRITY (Byte-level comparison against database seal)
    const isFileMatch = calculatedHash.toLowerCase() === dbEvidence.fileHash.toLowerCase();
    const fileIntegrity = isFileMatch ? "MATCH" : "MISMATCH";

    // Check C: NETWORK STATUS (Ethereum JSON-RPC & Smart Contract connectivity)
    let networkStatus = "OPERATIONAL";
    let networkError = null;
    let isContractAccessible = false;
    try {
      if (!blockchainService.provider || !blockchainService.contract) {
        blockchainService.initBlockchain();
      }
      await blockchainService.provider.getBlockNumber();
      try {
        await blockchainService.contract.owner();
        isContractAccessible = true;
      } catch (cErr) {
        isContractAccessible = false;
      }
    } catch (netErr) {
      networkStatus = "NODE_UNAVAILABLE";
      networkError = netErr.message;
    }

    // Check B: BLOCKCHAIN ANCHORING (On-chain smart contract existence & baseline verification)
    let blockchainAnchoring = "UNAVAILABLE";
    let onChainHash = null;
    let onChainEvidence = null;

    if (networkStatus === "OPERATIONAL" && isContractAccessible) {
      try {
        onChainEvidence = await blockchainService.contract.getEvidence(evidenceId);
        onChainHash = onChainEvidence[1];
        const existsOnChain = Boolean(onChainEvidence[7]);

        if (existsOnChain && onChainHash) {
          // Compare on-chain hash with registered database baseline
          const isBaselineAnchored = onChainHash.toLowerCase() === dbEvidence.fileHash.toLowerCase();
          blockchainAnchoring = isBaselineAnchored ? "CONFIRMED" : "CORRUPTED_ON_CHAIN";
        } else {
          blockchainAnchoring = "NOT_ANCHORED";
        }
      } catch (contractErr) {
        // Contract call reverted: Record does not exist on active chain instance
        const wasPreviouslyAnchored = Boolean(dbEvidence.blockchainTxId) ||
          dbEvidence.blockchainStatus === "CONFIRMED" ||
          dbEvidence.blockchainStatus === "PREVIOUS_CHAIN";

        if (wasPreviouslyAnchored) {
          blockchainAnchoring = "PREVIOUS_CHAIN";
          if (dbEvidence.blockchainStatus === "CONFIRMED") {
            dbEvidence.blockchainStatus = "PREVIOUS_CHAIN";
            await dbEvidence.save();
          }
        } else {
          blockchainAnchoring = "NOT_ANCHORED";
        }
      }
    } else if (networkStatus === "OPERATIONAL" && !isContractAccessible) {
      blockchainAnchoring = "CONTRACT_NOT_DEPLOYED";
    } else {
      blockchainAnchoring = "NODE_UNAVAILABLE";
    }

    // -------------------------------------------------------------
    // INTEGRITY VERDICT EVALUATION
    // Important: A database hash match is NOT blockchain confirmation.
    // An offline node is NEVER evidence tampering.
    // -------------------------------------------------------------
    let resultStatus = "tampered";
    if (fileIntegrity === "MATCH") {
      resultStatus = "verified"; // File is authentic to registered record
    }

    // Log the verification attempt in PostgreSQL
    const log = await VerificationLog.create({
      evidenceId,
      verifiedBy: userId,
      submittedHash: calculatedHash,
      originalHash: dbEvidence.fileHash,
      result: resultStatus,
      timestamp: new Date()
    });

    // Write to enterprise audit ledger (Task 6)
    if (fileIntegrity === "MISMATCH") {
      await logAudit({
        category: "EVIDENCE",
        action: "EVIDENCE_VERIFIED_TAMPER_DETECTED",
        actorId: userId,
        caseId: dbEvidence.caseId,
        evidenceId,
        status: "WARNING",
        details: {
          evidenceName: dbEvidence.evidenceName,
          submittedHash: calculatedHash,
          registeredHash: dbEvidence.fileHash,
          fileIntegrity,
          blockchainAnchoring,
          networkStatus
        }
      });
      await logAudit({
        category: "BLOCKCHAIN",
        action: "BLOCKCHAIN_VERIFICATION_FAILED",
        actorId: userId,
        caseId: dbEvidence.caseId,
        evidenceId,
        status: "WARNING",
        details: {
          reason: "Uploaded file hash does not match registered baseline.",
          submittedHash: calculatedHash
        }
      });
    } else {
      await logAudit({
        category: "EVIDENCE",
        action: "EVIDENCE_VERIFIED_MATCH",
        actorId: userId,
        caseId: dbEvidence.caseId,
        evidenceId,
        status: "SUCCESS",
        details: {
          evidenceName: dbEvidence.evidenceName,
          submittedHash: calculatedHash,
          registeredHash: dbEvidence.fileHash,
          fileIntegrity,
          blockchainAnchoring,
          networkStatus
        }
      });

      if (blockchainAnchoring === "CONFIRMED") {
        await logAudit({
          category: "BLOCKCHAIN",
          action: "BLOCKCHAIN_VERIFICATION_COMPLETED",
          actorId: userId,
          caseId: dbEvidence.caseId,
          evidenceId,
          status: "SUCCESS",
          blockchainTxId: dbEvidence.blockchainTxId,
          details: {
            onChainHash,
            blockchainAnchoring: "CONFIRMED"
          }
        });
      }
    }

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
      originalHash: dbEvidence.fileHash,
      submittedHash: calculatedHash,
      onChainHash: onChainHash || null,
      originalSize: Number(dbEvidence.fileSize),
      uploadedSize: stat.size,
      registeredFileType: dbEvidence.fileType,
      result: resultStatus,
      isVerified: isFileMatch,
      fileIntegrity,
      blockchainAnchoring,
      networkStatus,
      isBlockchainConfirmed: blockchainAnchoring === "CONFIRMED",
      witnessSource: blockchainAnchoring === "CONFIRMED" ? "ON_CHAIN_ETHEREUM_SMART_CONTRACT" : "POSTGRESQL_CRYPTOGRAPHIC_REGISTRY",
      isBlockchainWitnessed: blockchainAnchoring === "CONFIRMED",
      timestamp: log.timestamp,
      blockchainTxId: dbEvidence.blockchainTxId,
      ipfsCid: dbEvidence.ipfsCid,
      submitter: dbEvidence.submitter,
      currentCustodian: dbEvidence.custodian,
      pHashSimilarity,
      statutoryStandards: {
        technicalVerdict: isFileMatch 
          ? (blockchainAnchoring === "CONFIRMED" 
              ? "INTEGRITY VERIFIED — HASH MATCH (Corroborated on Ethereum Smart Contract & Database)"
              : "INTEGRITY VERIFIED — LOCAL HASH MATCH (Corroborated against Database Seal; On-Chain Anchoring: " + blockchainAnchoring + ")")
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
