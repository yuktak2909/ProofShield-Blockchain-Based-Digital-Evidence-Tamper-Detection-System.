const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notifications.controller");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", notificationsController.getNotifications);
router.patch("/:id/read", notificationsController.markAsRead);
router.post("/mark-all-read", notificationsController.markAllAsRead);

module.exports = router;

