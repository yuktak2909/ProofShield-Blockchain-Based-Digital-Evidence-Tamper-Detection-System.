const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Case = sequelize.define("Case", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  caseNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: "Digital Forensics", // Digital Forensics, Financial Fraud, Cyber Incident, Homicide, Narcotics, Internal Affairs
  },
  status: {
    type: DataTypes.ENUM("Open", "Under Investigation", "Pending Review", "Closed"),
    defaultValue: "Open",
  },
  priority: {
    type: DataTypes.ENUM("Low", "Medium", "High", "Critical"),
    defaultValue: "Medium",
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  assignedInvestigatorId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  assignedAnalystId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  closedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  closureReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: "cases",
  timestamps: true,
});

module.exports = Case;
