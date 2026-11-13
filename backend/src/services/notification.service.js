const { Notification } = require("../models");

/**
 * Create a real system notification for an authenticated user
 */
async function createNotification({
  userId,
  title,
  message,
  type = "SYSTEM",
  link = null
}) {
  try {
    const notif = await Notification.create({
      userId,
      title,
      message,
      type,
      link,
      isRead: false,
      timestamp: new Date()
    });
    return notif;
  } catch (err) {
    console.error("Failed to create notification:", err.message);
    return null;
  }
}

module.exports = {
  createNotification
};
