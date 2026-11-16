const express = require("express");
const router = express.Router();
const verificationController = require("../controllers/verification.controller");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "File upload failed." });
    }
    next();
  });
};

// Mounted at /api
router.post("/verify", protect, handleUpload, verificationController.verifyFile);
router.get("/evidence/:id/verifications", protect, verificationController.getVerifications);

module.exports = router;
