const Notification = require('../model/Notification');
const User = require('../model/User');

const createNotification = async (userId, title, message, link) => {
  let notifications = [];

  if (userId === "all") {
    const users = await User.find().select("_id username email");

    for (const user of users) {
      const notification = new Notification({
        userId: user._id,
        title,
        message,
        link,
      });
      await notification.save();
      notifications.push(notification);
    }
    return notifications;
  } else {
    const user = await User.findById(userId).select("_id username email");
    if (!user) {
      throw { status: 404, message: "User not found for notification" };
    }

    const notification = new Notification({ userId, title, message, link });
    await notification.save();
    return notification;
  }
};

const createUserNotification = async (userId, title, message, link) => {
    if (!userId || !title || !message) {
        throw { status: 400, message: "User ID, title, and message are required." };
    }

    const notification = new Notification({ userId, title, message, link });
    await notification.save();
    return notification;
};


const getAllNotifications = async (page = 1, limit = 5, username) => {
    const query = {};
    if (username) {
      const matchingUsers = await User.find({ username: { $regex: username, $options: 'i' } }).select('_id');
      const userIds = matchingUsers.map(user => user._id);
      query.userId = { $in: userIds };
    }

    const notifications = await Notification.find(query)
      .populate("userId", "username email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10))
      .exec();

    const total = await Notification.countDocuments(query);

    const formattedNotifications = notifications.map((notification) => ({
      id: notification._id,
      user: {
        id: notification?.userId?._id,
        username: notification?.userId?.username,
        email: notification?.userId?.email,
      },
      title: notification?.title,
      message: notification?.message,
      link: notification?.link,
      createdAt: notification?.createdAt,
    }));


    return {
      notifications: formattedNotifications,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / limit),
    };
};

const getUserNotifications = async (userId) => {
    if (!userId) {
        throw { status: 400, message: "User ID is required to fetch notifications." };
    }
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .exec();

    return notifications;
};


const deleteNotification = async (notificationId) => {
  const deletedNotification = await Notification.findByIdAndDelete(notificationId).exec();

  if (!deletedNotification) {
    throw { status: 404, message: "Notification not found" };
  }

  return deletedNotification;
};

const markNotificationAsRead = async (notificationId, userId) => {
    if (!notificationId || !userId) {
        throw { status: 400, message: "Notification ID and User ID are required." };
    }

    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId: userId },
        { read: true },
        { new: true }
    ).exec();

    if (!notification) {
        throw { status: 404, message: "Notification not found or does not belong to this user" };
    }

    return notification;
};


module.exports = {
  createNotification,
  createUserNotification,
  getAllNotifications,
  getUserNotifications,
  deleteNotification,
  markNotificationAsRead,
};