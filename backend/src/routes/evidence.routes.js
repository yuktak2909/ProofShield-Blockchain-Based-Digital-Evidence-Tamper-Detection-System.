const express = require("express");
const router = express.Router();
const evidenceController = require("../controllers/evidence.controller");
const { protect, restrictTo } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public IPFS gateway endpoint (no authorization needed to view file assets in img/video tags)
router.get("/mock-ipfs/:cid", evidenceController.serveMockIpfsFile);

// Safe multer file upload wrapper that catches validation and size errors gracefully
const handleEvidenceUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          error: "File size limit exceeded. Maximum file size allowed is 250 MB."
        });
      }
      return res.status(400).json({
        error: err.message || "File upload validation failed."
      });
    }
    next();
  });
};

// Protected routes below
router.use(protect);

router.get("/", evidenceController.getEvidence);
router.post("/", restrictTo("admin", "investigator"), handleEvidenceUpload, evidenceController.registerEvidence);
router.get("/:id", evidenceController.getEvidenceById);
router.get("/:id/blockchain", evidenceController.getEvidenceBlockchainInfo);
router.post("/:id/anchor", restrictTo("admin", "investigator"), evidenceController.anchorEvidenceOnChain);

// Legal Hold Management
router.post("/:id/legal-hold", restrictTo("admin"), evidenceController.applyLegalHold);
router.post("/:id/release-hold", restrictTo("admin"), evidenceController.releaseLegalHold);

module.exports = router;
