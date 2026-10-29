const express = require("express");
const router = express.Router();
const verificationController = require("../controllers/verification.controller");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Mounted at /api
router.post("/verify", protect, upload.single("file"), verificationController.verifyFile);
router.get("/evidence/:id/verifications", protect, verificationController.getVerifications);

module.exports = router;
