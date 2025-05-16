const notificationService = require("../services/notificationService");
const {
  sendNotificationEmail,
} = require("../controllers/email/sendTransactionEmailNotification");
const User = require('../model/User');

const createNotification = async (req, res, next) => {
  const { userId, title, message, link } = req.body;

  if (!userId || !title || !message) {
    return next({
      status: 400,
      message: "User ID, title, and message are required.",
    });
  }

  try {
    const result = await notificationService.createNotification(
      userId,
      title,
      message,
      link
    );

    if (userId === "all") {
      const usersWithNotifications = await Promise.all(
        result.map(async (notif) => {
          const user = await User.findById(notif.userId).select(
            "username email"
          );
          if (user) {
            await sendNotificationEmail(user.email, user.username, {
              status: "New Notification",
              product_name: title,
              amount: message,
              type: "Notification",
            });
          }
          return {
            ...notif.toObject(),
            user: user
              ? { id: user._id, username: user.username, email: user.email }
              : null,
          };
        })
      );
      return res.status(201).json({
        message: `${usersWithNotifications.length} notifications sent to all users.`,
        notifications: usersWithNotifications,
      });
    } else {
      const user = await User.findById(result.userId).select("username email");
      if (!user) {
        console.log("testing......")
        console.warn(
          `Notification created for user ID ${result.userId} but user not found for response.`
        );
        return res.status(201).json({ notification: result.toObject() });
      }

      await sendNotificationEmail(user.email, user.username, {
        status: "New Notification",
        product_name: title,
        amount: message,
        type: "Notification",
      });

      return res.status(201).json({
        notification: {
          ...result.toObject(),
          user: { id: user._id, username: user.username, email: user.email },
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const notifications = await notificationService.getUserNotifications(
      userId
    );
    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

const readNotification = async (req, res, next) => {
  const notificationId = req.params.id;
  const userId = req.user.id;

  if (!notificationId) {
    return next({
      status: 400,
      message: "Notification ID is required in URL parameters.",
    });
  }

  try {
    const updatedNotification =
      await notificationService.markNotificationAsRead(notificationId, userId);
    res.status(200).json(updatedNotification);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotification,
  getNotifications,
  readNotification,
};
