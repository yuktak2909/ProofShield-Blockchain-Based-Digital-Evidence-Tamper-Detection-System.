const express = require("express");
const router = express.Router();
const casesController = require("../controllers/cases.controller");
const { protect, restrictTo } = require("../middleware/auth");

router.use(protect);

router.get("/", casesController.getCases);
router.post("/", restrictTo("admin", "investigator"), casesController.createCase);
router.get("/:caseId", casesController.getCaseById);
router.patch("/:caseId", restrictTo("admin", "investigator"), casesController.updateCase);
router.post("/:caseId/close", restrictTo("admin", "investigator"), casesController.closeCase);
router.get("/:caseId/activities", casesController.getCaseActivities);

module.exports = router;
