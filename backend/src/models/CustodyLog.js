const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const CustodyLog = sequelize.define("CustodyLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  evidenceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  actorId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  action: {
    type: DataTypes.ENUM("viewed", "downloaded", "transferred", "transfer_initiated", "transfer_accepted", "transfer_rejected", "transfer_cancelled", "legal_hold_applied", "legal_hold_released"),
    allowNull: false,
  },
  previousCustodian: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  newCustodian: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  transferState: {
    type: DataTypes.ENUM("Pending", "Accepted", "Rejected", "Cancelled", "Completed"),
    defaultValue: "Completed",
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true, // Reason for transfer or rejection
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  evidenceCondition: {
    type: DataTypes.STRING,
    defaultValue: "Intact / Verified Cryptographic Container", // Intact, Sealed, Degraded, etc.
  },
  digitalSignature: {
    type: DataTypes.TEXT,
    allowNull: true, // Cryptographic signature commitment
  },
  blockchainTxId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  blockchainStatus: {
    type: DataTypes.STRING,
    defaultValue: "CONFIRMED", // PENDING, CONFIRMED, FAILED, NOT_ANCHORED
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "custody_logs",
  timestamps: true,
});

module.exports = CustodyLog;
