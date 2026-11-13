const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const AuditLog = sequelize.define("AuditLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  category: {
    type: DataTypes.ENUM("AUTH", "CASE", "EVIDENCE", "CUSTODY", "BLOCKCHAIN", "ADMIN", "RETENTION", "REPORT"),
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false, // e.g. "USER_LOGIN_SUCCESS", "EVIDENCE_REGISTERED", "CUSTODY_TRANSFER_INITIATED"
  },
  actorId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  actorRole: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  caseId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  evidenceId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("SUCCESS", "FAILURE", "WARNING"),
    defaultValue: "SUCCESS",
  },
  blockchainTxId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "audit_logs",
  timestamps: true,
});

module.exports = AuditLog;
