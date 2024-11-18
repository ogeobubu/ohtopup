const Notification = require("../model/Notification");

const createNotification = async (req, res) => {
  const { userId, type, message, link } = req.body;
  const notification = new Notification({ userId, type, message, link });
  await notification.save();
  res.status(201).json(notification);
};

const getNotification = async (req, res) => {
  const notifications = await Notification.find({ userId: req.params.userId });
  res.json(notifications);
};

const readNotification = async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );
  
  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  res.json(notification);
};

module.exports = {
  createNotification,
  getNotification,
  readNotification
};