const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const VerificationLog = sequelize.define("VerificationLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  evidenceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  verifiedBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  submittedHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  originalHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  result: {
    type: DataTypes.ENUM("verified", "tampered"),
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "verification_logs",
});

module.exports = VerificationLog;
