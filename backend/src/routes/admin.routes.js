const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { protect, restrictTo } = require("../middleware/auth");

router.use(protect);

// Dashboard statistics available to authenticated users
router.get("/stats", adminController.getSystemStats);

// System diagnostics and health
router.get("/health", restrictTo("admin", "court"), adminController.getSystemHealth);

// User administration routes
router.use(restrictTo("admin"));
router.get("/users", adminController.getUsers);
router.post("/users", adminController.createUser);
router.patch("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

module.exports = router;
