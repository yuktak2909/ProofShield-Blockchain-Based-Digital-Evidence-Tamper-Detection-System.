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
    type: DataTypes.ENUM("viewed", "downloaded", "transferred"),
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
  blockchainTxId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "custody_logs",
});

module.exports = CustodyLog;
