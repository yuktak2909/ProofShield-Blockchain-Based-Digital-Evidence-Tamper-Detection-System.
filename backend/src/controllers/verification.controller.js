const fs = require("fs");
const { VerificationLog, User } = require("../models");
const verificationService = require("../services/verification.service");

exports.verifyFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file was uploaded for verification." });
  }

  const tempFilePath = req.file.path;
  const { evidenceId } = req.body;

  if (!evidenceId) {
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    return res.status(400).json({ error: "Missing required field: evidenceId is required to verify the file." });
  }

  try {
    console.log(`Starting verification for evidence ${evidenceId} with file ${req.file.originalname}...`);
    
    // Run verification service
    const report = await verificationService.verifyEvidenceFile(evidenceId, tempFilePath, req.user.id);
    
    // Clean up temp file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    return res.status(200).json({
      message: report.isVerified ? "Integrity verification successful." : "WARNING: File tampering detected!",
      report
    });
  } catch (error) {
    console.error("Verification endpoint error:", error);
    
    // Clean up temp file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    return res.status(500).json({ error: "Verification failed: " + error.message });
  }
};

exports.getVerifications = async (req, res) => {
  try {
    const { id } = req.params; // evidenceId

    const verifications = await VerificationLog.findAll({
      where: { evidenceId: id },
      include: [
        { model: User, as: "verifier", attributes: ["name", "email", "role"] }
      ],
      order: [["timestamp", "DESC"]]
    });

    return res.status(200).json(verifications);
  } catch (error) {
    console.error("Get verifications error:", error);
    return res.status(500).json({ error: "Failed to retrieve verification logs." });
  }
};
