const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reports.controller");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/certificate/:evidenceId", reportsController.getCustodyCertificate);
router.get("/verification/:evidenceId", reportsController.getVerificationCertificate);
router.get("/case/:caseId", reportsController.getCaseReport);

module.exports = router;

