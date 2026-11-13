const { Case, Evidence, User, AuditLog, CustodyLog } = require("../models");
const { logAudit } = require("../services/audit.service");
const { createNotification } = require("../services/notification.service");

exports.getCases = async (req, res) => {
  try {
    const cases = await Case.findAll({
      include: [
        { model: User, as: "creator", attributes: ["name", "email"] },
        { model: User, as: "assignedInvestigator", attributes: ["id", "name", "email"] },
        { model: User, as: "assignedAnalyst", attributes: ["id", "name", "email"] },
        { model: Evidence, as: "evidenceItems", attributes: ["id", "evidenceName", "status", "retentionStatus", "fileType"] }
      ],
      order: [["createdAt", "DESC"]]
    });
    
    return res.status(200).json(cases);
  } catch (error) {
    console.error("Get cases error:", error);
    return res.status(500).json({ error: "Failed to retrieve cases." });
  }
};

exports.createCase = async (req, res) => {
  try {
    const { title, description, category, priority, assignedInvestigatorId, assignedAnalystId } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Case title is required." });
    }

    // Generate unique Case Number: PS-YYYY-XXX
    const year = new Date().getFullYear();
    const count = await Case.count();
    const caseNumber = `PS-${year}-${String(count + 1).padStart(3, "0")}`;

    const newCase = await Case.create({
      caseNumber,
      title,
      description,
      category: category || "Digital Forensics",
      priority: priority || "Medium",
      status: "Open",
      createdBy: req.user.id,
      assignedInvestigatorId: assignedInvestigatorId || req.user.id,
      assignedAnalystId: assignedAnalystId || null,
    });

    // Log to Audit Ledger
    await logAudit({
      category: "CASE",
      action: "CASE_CREATED",
      actorId: req.user.id,
      actorRole: req.user.role,
      caseId: newCase.id,
      ipAddress: req.ip,
      details: { caseNumber, title, priority: newCase.priority, category: newCase.category }
    });

    if (assignedInvestigatorId && assignedInvestigatorId !== req.user.id) {
      await createNotification({
        userId: assignedInvestigatorId,
        title: `Case Assigned: ${caseNumber}`,
        message: `You have been assigned as lead investigator on "${title}".`,
        type: "CASE",
        link: `/cases/${newCase.id}`
      });
    }

    return res.status(201).json({
      message: "Case created successfully.",
      case: newCase
    });
  } catch (error) {
    console.error("Create case error:", error);
    return res.status(500).json({ error: "Failed to create case: " + error.message });
  }
};

exports.getCaseById = async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseItem = await Case.findByPk(caseId, {
      include: [
        { model: User, as: "creator", attributes: ["name", "email", "walletAddress"] },
        { model: User, as: "assignedInvestigator", attributes: ["id", "name", "email", "role"] },
        { model: User, as: "assignedAnalyst", attributes: ["id", "name", "email", "role"] },
        { model: User, as: "closer", attributes: ["id", "name", "email"] },
        { 
          model: Evidence, 
          as: "evidenceItems",
          include: [
            { model: User, as: "submitter", attributes: ["name"] },
            { model: User, as: "custodian", attributes: ["name", "email"] }
          ]
        }
      ]
    });

    if (!caseItem) {
      return res.status(404).json({ error: "Case not found." });
    }

    return res.status(200).json(caseItem);
  } catch (error) {
    console.error("Get case by ID error:", error);
    return res.status(500).json({ error: "Failed to retrieve case details." });
  }
};

exports.updateCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { title, description, category, priority, status, assignedInvestigatorId, assignedAnalystId } = req.body;

    const caseItem = await Case.findByPk(caseId);
    if (!caseItem) {
      return res.status(404).json({ error: "Case not found." });
    }

    if (caseItem.status === "Closed" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Case is closed and sealed. Only system administrators can modify archived case records." });
    }

    if (title !== undefined) caseItem.title = title;
    if (description !== undefined) caseItem.description = description;
    if (category !== undefined) caseItem.category = category;
    if (priority !== undefined) caseItem.priority = priority;
    if (status !== undefined) caseItem.status = status;
    if (assignedInvestigatorId !== undefined) caseItem.assignedInvestigatorId = assignedInvestigatorId;
    if (assignedAnalystId !== undefined) caseItem.assignedAnalystId = assignedAnalystId;

    await caseItem.save();

    await logAudit({
      category: "CASE",
      action: "CASE_UPDATED",
      actorId: req.user.id,
      actorRole: req.user.role,
      caseId: caseItem.id,
      ipAddress: req.ip,
      details: { title: caseItem.title, status: caseItem.status, priority: caseItem.priority }
    });

    return res.status(200).json({
      message: "Case updated successfully.",
      case: caseItem
    });
  } catch (error) {
    console.error("Update case error:", error);
    return res.status(500).json({ error: "Failed to update case: " + error.message });
  }
};

exports.closeCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { closureReason } = req.body;

    if (!closureReason) {
      return res.status(400).json({ error: "Closure reason and justification are required." });
    }

    const caseItem = await Case.findByPk(caseId);
    if (!caseItem) {
      return res.status(404).json({ error: "Case not found." });
    }

    if (caseItem.status === "Closed") {
      return res.status(400).json({ error: "Case is already closed." });
    }

    caseItem.status = "Closed";
    caseItem.closedAt = new Date();
    caseItem.closedBy = req.user.id;
    caseItem.closureReason = closureReason;
    await caseItem.save();

    await logAudit({
      category: "CASE",
      action: "CASE_CLOSED",
      actorId: req.user.id,
      actorRole: req.user.role,
      caseId: caseItem.id,
      ipAddress: req.ip,
      details: { closureReason, closedAt: caseItem.closedAt }
    });

    return res.status(200).json({
      message: "Case has been officially closed and archived.",
      case: caseItem
    });
  } catch (error) {
    console.error("Close case error:", error);
    return res.status(500).json({ error: "Failed to close case: " + error.message });
  }
};

exports.getCaseActivities = async (req, res) => {
  try {
    const { caseId } = req.params;

    // Fetch related audit logs and custody logs
    const auditLogs = await AuditLog.findAll({
      where: { caseId },
      include: [{ model: User, as: "actor", attributes: ["name", "role", "email"] }],
      order: [["timestamp", "DESC"]],
      limit: 50
    });

    return res.status(200).json(auditLogs);
  } catch (error) {
    console.error("Get case activities error:", error);
    return res.status(500).json({ error: "Failed to retrieve case activities." });
  }
};
