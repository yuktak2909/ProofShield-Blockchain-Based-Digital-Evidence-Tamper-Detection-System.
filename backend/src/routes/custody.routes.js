const express = require("express");
const router = express.Router();
const custodyController = require("../controllers/custody.controller");
const { protect, restrictTo } = require("../middleware/auth");

router.use(protect);

router.post("/:id/view", custodyController.viewEvidence);
router.post("/:id/download", custodyController.downloadEvidence);
router.post("/:id/transfer", restrictTo("admin", "investigator", "analyst"), custodyController.initiateTransfer);
router.post("/:id/transfer/initiate", restrictTo("admin", "investigator", "analyst"), custodyController.initiateTransfer);
router.post("/:id/transfer/accept", restrictTo("admin", "investigator", "analyst", "court"), custodyController.acceptTransfer);
router.post("/:id/transfer/reject", restrictTo("admin", "investigator", "analyst", "court"), custodyController.rejectTransfer);
router.post("/:id/transfer/cancel", restrictTo("admin", "investigator", "analyst"), custodyController.cancelTransfer);
router.get("/:id/custody", custodyController.getCustodyHistory);

module.exports = router;
