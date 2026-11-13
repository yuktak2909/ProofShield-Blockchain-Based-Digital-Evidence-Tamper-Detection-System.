const express = require("express");
const router = express.Router();
const evidenceController = require("../controllers/evidence.controller");
const { protect, restrictTo } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public IPFS gateway endpoint (no authorization needed to view file assets in img/video tags)
router.get("/mock-ipfs/:cid", evidenceController.serveMockIpfsFile);

// Protected routes below
router.use(protect);

router.get("/", evidenceController.getEvidence);
router.post("/", restrictTo("admin", "investigator"), upload.single("file"), evidenceController.registerEvidence);
router.get("/:id", evidenceController.getEvidenceById);
router.get("/:id/blockchain", evidenceController.getEvidenceBlockchainInfo);

// Legal Hold Management
router.post("/:id/legal-hold", restrictTo("admin"), evidenceController.applyLegalHold);
router.post("/:id/release-hold", restrictTo("admin"), evidenceController.releaseLegalHold);

module.exports = router;
