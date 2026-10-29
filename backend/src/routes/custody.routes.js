const express = require("express");
const router = express.Router();
const custodyController = require("../controllers/custody.controller");
const { protect, restrictTo } = require("../middleware/auth");

router.use(protect);

// These will be mounted under /api/evidence
router.post("/:id/view", custodyController.viewEvidence);
router.post("/:id/download", custodyController.downloadEvidence);
router.post("/:id/transfer", restrictTo("admin", "investigator", "analyst"), custodyController.transferCustody);
router.get("/:id/custody", custodyController.getCustodyHistory);

module.exports = router;
