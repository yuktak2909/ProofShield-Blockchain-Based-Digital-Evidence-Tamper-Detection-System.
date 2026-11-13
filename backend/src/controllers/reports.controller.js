const { Evidence, Case, User, CustodyLog, VerificationLog } = require("../models");
const blockchainService = require("../services/blockchain.service");

exports.getCustodyCertificate = async (req, res) => {
  try {
    const { evidenceId } = req.params;

    const evidence = await Evidence.findByPk(evidenceId, {
      include: [
        { model: Case, as: "case" },
        { model: User, as: "submitter", attributes: ["name", "email", "role", "walletAddress"] },
        { model: User, as: "custodian", attributes: ["name", "email", "role", "walletAddress"] }
      ]
    });

    if (!evidence) {
      return res.status(404).json({ error: "Evidence record not found." });
    }

    const custodyLogs = await CustodyLog.findAll({
      where: { evidenceId },
      include: [
        { model: User, as: "actor", attributes: ["name", "role", "email"] },
        { model: User, as: "prevCustodian", attributes: ["name", "email", "walletAddress"] },
        { model: User, as: "nextCustodian", attributes: ["name", "email", "walletAddress"] }
      ],
      order: [["timestamp", "ASC"]]
    });

    let onChainEvidence = null;
    try {
      onChainEvidence = await blockchainService.getEvidence(evidenceId);
    } catch (e) {
      console.warn("Could not query blockchain for report:", e.message);
    }

    const certificate = {
      certificateNumber: `PSC-CUSTODY-${evidence.id.substring(0, 8).toUpperCase()}`,
      issuedAt: new Date().toISOString(),
      issuer: {
        system: "ProofShield Forensic Ledger Core",
        issuingAuthority: "Digital Evidence Laboratory & Judicial Custody Repository",
        operator: req.user.name,
        operatorRole: req.user.role
      },
      caseMetadata: {
        caseNumber: evidence.case?.caseNumber || "UNLINKED",
        caseTitle: evidence.case?.title || "Standalone Evidence",
        status: evidence.case?.status || "Open"
      },
      evidenceMetadata: {
        evidenceId: evidence.id,
        evidenceName: evidence.evidenceName,
        category: evidence.category,
        fileType: evidence.fileType,
        fileSize: `${(evidence.fileSize / (1024 * 1024)).toFixed(2)} MB (${evidence.fileSize} bytes)`,
        sha256Digest: evidence.fileHash,
        ipfsCid: evidence.ipfsCid,
        acquisitionSource: evidence.acquisitionSource,
        acquisitionMethod: evidence.acquisitionMethod,
        collectionTimestamp: evidence.collectionTimestamp,
        location: evidence.location,
        retentionStatus: evidence.retentionStatus
      },
      blockchainWitness: {
        network: "Ethereum Local Node (Chain ID 1337)",
        contractAddress: blockchainService.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        transactionHash: evidence.blockchainTxId,
        onChainCommitment: onChainEvidence?.fileHash || evidence.fileHash,
        smartContractWitnessed: Boolean(onChainEvidence?.exists)
      },
      custodyHandoffHistory: custodyLogs.map((log, idx) => ({
        sequence: idx + 1,
        action: log.action,
        transferState: log.transferState,
        timestamp: log.timestamp,
        fromCustodian: log.prevCustodian?.name || "System Initial Seizure",
        toCustodian: log.nextCustodian?.name || "Evidence Locker",
        reason: log.reason || "Case progression handoff",
        evidenceCondition: log.evidenceCondition,
        blockchainTxId: log.blockchainTxId
      })),
      complianceStatement: "This document certifies that the aforementioned digital payload has been indexed and transferred in compliance with international digital forensics ISO/IEC 27037 standards and electronic record custody governance."
    };

    return res.status(200).json(certificate);
  } catch (error) {
    console.error("Get custody certificate error:", error);
    return res.status(500).json({ error: "Failed to generate custody certificate: " + error.message });
  }
};

exports.getVerificationCertificate = async (req, res) => {
  try {
    const { evidenceId } = req.params;

    const evidence = await Evidence.findByPk(evidenceId, {
      include: [
        { model: Case, as: "case" },
        { model: User, as: "submitter" }
      ]
    });

    if (!evidence) {
      return res.status(404).json({ error: "Evidence record not found." });
    }

    const verificationLogs = await VerificationLog.findAll({
      where: { evidenceId },
      include: [{ model: User, as: "verifier", attributes: ["name", "email", "role"] }],
      order: [["timestamp", "DESC"]]
    });

    const certificate = {
      certificateNumber: `PSC-INTEGRITY-${evidence.id.substring(0, 8).toUpperCase()}`,
      issuedAt: new Date().toISOString(),
      evidenceId: evidence.id,
      evidenceName: evidence.evidenceName,
      caseNumber: evidence.case?.caseNumber,
      registeredSha256: evidence.fileHash,
      blockchainTxId: evidence.blockchainTxId,
      retentionStatus: evidence.retentionStatus,
      totalAuditsExecuted: verificationLogs.length,
      lastVerification: verificationLogs[0] || null,
      verificationHistory: verificationLogs,
      statutoryStandards: {
        federalRulesOfEvidence: "FRE Rule 902(13)/(14) - Certified Records Generated by an Electronic Process or System (Requires technical witness testimony or certification by a qualified forensic examiner)",
        bharatiyaSakshyaAdhiniyam2023: "BSA 2023 Section 61, 62 & 63 - Electronic Records Admissibility & Hash Witness (Byte-level mathematical corroboration between registered ledger hash and examined payload)"
      }
    };

    return res.status(200).json(certificate);
  } catch (error) {
    console.error("Get verification certificate error:", error);
    return res.status(500).json({ error: "Failed to generate verification report: " + error.message });
  }
};

exports.getCaseReport = async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseItem = await Case.findByPk(caseId, {
      include: [
        { model: User, as: "creator", attributes: ["name", "email"] },
        { model: User, as: "assignedInvestigator", attributes: ["name", "email"] },
        { model: User, as: "assignedAnalyst", attributes: ["name", "email"] },
        { model: User, as: "closer", attributes: ["name", "email"] },
        { 
          model: Evidence, 
          as: "evidenceItems",
          include: [{ model: User, as: "custodian", attributes: ["name"] }]
        }
      ]
    });

    if (!caseItem) {
      return res.status(404).json({ error: "Case not found." });
    }

    const report = {
      reportId: `PSR-CASE-${caseItem.caseNumber}`,
      generatedAt: new Date().toISOString(),
      caseDetails: caseItem,
      totalEvidenceCount: caseItem.evidenceItems.length,
      evidenceSummary: caseItem.evidenceItems.map(item => ({
        id: item.id,
        name: item.evidenceName,
        category: item.category,
        fileType: item.fileType,
        fileSize: item.fileSize,
        fileHash: item.fileHash,
        custodian: item.custodian?.name,
        retentionStatus: item.retentionStatus,
        blockchainTxId: item.blockchainTxId
      }))
    };

    return res.status(200).json(report);
  } catch (error) {
    console.error("Get case report error:", error);
    return res.status(500).json({ error: "Failed to generate case summary report: " + error.message });
  }
};

