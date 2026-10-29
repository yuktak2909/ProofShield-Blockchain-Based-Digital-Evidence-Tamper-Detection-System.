const sequelize = require("./db");
const User = require("./User");
const Case = require("./Case");
const Evidence = require("./Evidence");
const CustodyLog = require("./CustodyLog");
const VerificationLog = require("./VerificationLog");

// Associations

// User <-> Case (Created by Admin/Investigator)
User.hasMany(Case, { foreignKey: "createdBy", as: "createdCases" });
Case.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

// Case <-> Evidence
Case.hasMany(Evidence, { foreignKey: "caseId", as: "evidenceItems" });
Evidence.belongsTo(Case, { foreignKey: "caseId", as: "case" });

// User <-> Evidence (Submitted by)
User.hasMany(Evidence, { foreignKey: "submittedBy", as: "submittedEvidence" });
Evidence.belongsTo(User, { foreignKey: "submittedBy", as: "submitter" });

// User <-> Evidence (Current Custodian)
User.hasMany(Evidence, { foreignKey: "currentCustodian", as: "custodialEvidence" });
Evidence.belongsTo(User, { foreignKey: "currentCustodian", as: "custodian" });

// Evidence <-> CustodyLog
Evidence.hasMany(CustodyLog, { foreignKey: "evidenceId", as: "custodyLogs" });
CustodyLog.belongsTo(Evidence, { foreignKey: "evidenceId", as: "evidence" });

// CustodyLog <-> Actor (User)
CustodyLog.belongsTo(User, { foreignKey: "actorId", as: "actor" });

// CustodyLog <-> Custodians (User)
CustodyLog.belongsTo(User, { foreignKey: "previousCustodian", as: "prevCustodian" });
CustodyLog.belongsTo(User, { foreignKey: "newCustodian", as: "nextCustodian" });

// Evidence <-> VerificationLog
Evidence.hasMany(VerificationLog, { foreignKey: "evidenceId", as: "verificationLogs" });
VerificationLog.belongsTo(Evidence, { foreignKey: "evidenceId", as: "evidence" });

// VerificationLog <-> User (Verifier)
VerificationLog.belongsTo(User, { foreignKey: "verifiedBy", as: "verifier" });

module.exports = {
  sequelize,
  User,
  Case,
  Evidence,
  CustodyLog,
  VerificationLog,
};
