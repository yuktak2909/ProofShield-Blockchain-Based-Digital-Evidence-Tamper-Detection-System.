const { AuditLog } = require("../models");

/**
 * Log an audit event to the tamper-evident audit ledger
 */
async function logAudit({
  category,
  action,
  actorId = null,
  actorRole = null,
  caseId = null,
  evidenceId = null,
  ipAddress = null,
  details = null,
  status = "SUCCESS",
  blockchainTxId = null
}) {
  try {
    const entry = await AuditLog.create({
      category,
      action,
      actorId,
      actorRole,
      caseId,
      evidenceId,
      ipAddress,
      details: typeof details === "object" ? JSON.stringify(details) : details,
      status,
      blockchainTxId,
      timestamp: new Date()
    });
    return entry;
  } catch (err) {
    console.error("Failed to write audit log:", err.message);
    return null;
  }
}

module.exports = {
  logAudit
};

