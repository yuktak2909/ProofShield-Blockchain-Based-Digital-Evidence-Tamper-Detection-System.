const express = require("express");
const router = express.Router();
const auditController = require("../controllers/audit.controller");
const { protect, restrictTo } = require("../middleware/auth");

router.use(protect);
router.use(restrictTo("admin", "court"));

router.get("/", auditController.getAuditLogs);

module.exports = router;
