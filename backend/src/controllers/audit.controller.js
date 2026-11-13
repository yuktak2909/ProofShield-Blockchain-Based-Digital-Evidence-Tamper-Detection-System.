const { AuditLog, User, Case, Evidence } = require("../models");
const { Op } = require("sequelize");

exports.getAuditLogs = async (req, res) => {
  try {
    const { category, action, status, search, limit = 50, page = 1 } = req.query;

    const where = {};
    if (category) where.category = category;
    if (action) where.action = { [Op.like]: `%${action}%` };
    if (status) where.status = status;

    if (search) {
      where[Op.or] = [
        { action: { [Op.like]: `%${search}%` } },
        { details: { [Op.like]: `%${search}%` } },
        { ipAddress: { [Op.like]: `%${search}%` } },
        { blockchainTxId: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include: [
        { model: User, as: "actor", attributes: ["id", "name", "email", "role"] },
        { model: Case, as: "case", attributes: ["id", "caseNumber", "title"] },
        { model: Evidence, as: "evidence", attributes: ["id", "evidenceName", "fileHash"] }
      ],
      order: [["timestamp", "DESC"]],
      limit: parseInt(limit, 10),
      offset
    });

    return res.status(200).json({
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / parseInt(limit, 10)),
      logs
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    return res.status(500).json({ error: "Failed to retrieve system audit logs." });
  }
};
