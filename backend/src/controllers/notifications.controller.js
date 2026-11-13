const { Notification } = require("../models");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [["timestamp", "DESC"]],
      limit: 30
    });

    const unreadCount = await Notification.count({
      where: { userId: req.user.id, isRead: false }
    });

    return res.status(200).json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ error: "Failed to fetch notifications." });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findOne({
      where: { id, userId: req.user.id }
    });

    if (!notif) {
      return res.status(404).json({ error: "Notification not found." });
    }

    notif.isRead = true;
    await notif.save();

    return res.status(200).json({ message: "Notification marked as read." });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({ error: "Failed to update notification." });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );

    return res.status(200).json({ message: "All notifications marked as read." });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return res.status(500).json({ error: "Failed to mark all as read." });
  }
};
