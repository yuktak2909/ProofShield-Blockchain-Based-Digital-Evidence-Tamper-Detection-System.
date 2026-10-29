const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { protect, restrictTo } = require("../middleware/auth");

router.use(protect);

// Dashboard system statistics (available to all roles)
router.get("/stats", adminController.getSystemStats);

// User management endpoints (restricted to admin)
router.get("/users", restrictTo("admin"), adminController.getUsers);
router.post("/users", restrictTo("admin"), adminController.createUser);
router.patch("/users/:id", restrictTo("admin"), adminController.updateUser);
router.delete("/users/:id", restrictTo("admin"), adminController.deleteUser);

module.exports = router;
