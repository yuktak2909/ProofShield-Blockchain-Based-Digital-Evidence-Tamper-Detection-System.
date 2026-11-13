const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Evidence = sequelize.define("Evidence", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  caseId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  evidenceName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: "Surveillance / Audio-Visual", // Surveillance, Disk Image, Network Capture, Mobile Extraction, Document, Memory Dump
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  fileHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ipfsCid: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  submittedBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  blockchainTxId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  currentCustodian: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "REGISTERED", // PROCESSING, REGISTERED, REGISTRATION_FAILED
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Forensic Acquisition Metadata
  collectionTimestamp: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  acquisitionSource: {
    type: DataTypes.STRING,
    allowNull: true, // e.g. "CCTV NVR Server #2", "Suspect Laptop NVMe SSD"
  },
  acquisitionMethod: {
    type: DataTypes.STRING,
    allowNull: true, // e.g. "Physical Bit-Stream Image via Tableau T8u Write-Blocker", "Direct API Export"
  },
  collectorIdentity: {
    type: DataTypes.STRING,
    allowNull: true, // Official Badge # or Collector Name
  },
  deviceInfo: {
    type: DataTypes.STRING,
    allowNull: true, // Hardware serial, model, OS version
  },
  // Legal Hold & Retention Management
  retentionStatus: {
    type: DataTypes.ENUM("Active", "Under Legal Hold", "Retention Expired", "Pending Review", "Eligible for Authorized Disposal"),
    defaultValue: "Active",
  },
  legalHoldReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  legalHoldAppliedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  legalHoldAppliedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: "evidence",
  timestamps: true,
});

module.exports = Evidence;
