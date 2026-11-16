const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { protect, restrictTo } = require("../middleware/auth");

router.use(protect);

// Dashboard statistics available to authenticated users
router.get("/stats", adminController.getSystemStats);

// System diagnostics and health
router.get("/health", restrictTo("admin", "investigator", "analyst", "court"), adminController.getSystemHealth);

// User directory listing accessible to all authenticated officers (for custody handoff & custodian filter)
router.get("/users", adminController.getUsers);

// User administration mutation routes (admin only)
router.use(restrictTo("admin"));
router.post("/users", adminController.createUser);
router.patch("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

module.exports = router;
