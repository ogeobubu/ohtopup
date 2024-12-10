const Notification = require("../model/Notification");

const createNotification = async (req, res) => {
  const { userId, title, message, link } = req.body;
  const notification = new Notification({ userId, title, message, link });
  await notification.save();
  res.status(201).json(notification);
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

const readNotification = async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { read: true },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  res.json(notification);
};

module.exports = {
  createNotification,
  getNotifications,
  readNotification,
};
