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
    defaultValue: "PROCESSING", // PROCESSING, REGISTERED, REGISTRATION_FAILED
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  collectionTimestamp: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: "evidence",
});

module.exports = Evidence;
