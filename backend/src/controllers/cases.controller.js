const { Case, Evidence, User } = require("../models");

exports.getCases = async (req, res) => {
  try {
    const cases = await Case.findAll({
      include: [
        { model: User, as: "creator", attributes: ["name", "email"] },
        { model: Evidence, as: "evidenceItems", attributes: ["id", "status"] }
      ],
      order: [["created_at", "DESC"]]
    });
    
    return res.status(200).json(cases);
  } catch (error) {
    console.error("Get cases error:", error);
    return res.status(500).json({ error: "Failed to retrieve cases." });
  }
};

exports.createCase = async (req, res) => {
  try {
    const { title, description } = req.body;

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
      createdBy: req.user.id
    });

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
        { 
          model: Evidence, 
          as: "evidenceItems",
          include: [
            { model: User, as: "submitter", attributes: ["name"] },
            { model: User, as: "custodian", attributes: ["name"] }
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
