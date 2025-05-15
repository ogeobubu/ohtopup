const User = require("../model/User");
const Wallet = require("../model/Wallet");
const Transaction = require("../model/Transaction");
const axios = require("axios");
const { handleServiceError } = require("../middleware/errorHandler");

const authService = require("../services/authService");
const userService = require("../services/userService");
const notificationService = require("../services/notificationService");
const serviceCatalogService = require("../services/serviceCatalogService");
const rateService = require("../services/rateService");
const {
  sendTransactionEmailNotification,
} = require("./email/sendTransactionEmailNotification");

const loginAdmin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const token = await authService.loginAdminUser(email, password);
    res.status(200).json({ message: "Login successful!", token });
  } catch (error) {
    next(error);
  }
};

const getAdminReferrals = async (req, res, next) => {
  const { page, limit, search } = req.query;

  try {
    const referralData = await userService.getReferralsData(
      page,
      limit,
      search
    );

    return res.status(200).json(referralData);
  } catch (error) {
    next(error);
  }
};

const getAdmin = async (req, res, next) => {
  const adminId = req.user.id;
  try {
    const user = await userService.getAdminUser(adminId);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const updateAdmin = async (req, res, next) => {
  const adminId = req.user.id;
  const { phoneNumber, newPassword, oldPassword } = req.body;

  try {
    const updatedUser = await userService.updateAdminUser(
      adminId,
      phoneNumber,
      newPassword,
      oldPassword
    );

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  const { page, limit, search, role, status } = req.query;

  try {
    const { users, totalCount } = await userService.getAllUsers(
      page,
      limit,
      search,
      role,
      status
    );

    res.status(200).json({ users, totalCount });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  const userId = req.params.id;
  const { isDeleted, ...otherUpdates } = req.body;

  try {
    const updatedUser = await userService.updateUser(userId, {
      isDeleted,
      ...otherUpdates,
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

const getUserAnalytics = async (req, res, next) => {
  try {
    const analyticsData = await userService.getUserAnalytics();
    res.status(200).json(analyticsData);
  } catch (error) {
    next(error);
  }
};

const createNotification = async (req, res, next) => {
  const { userId, title, message, link } = req.body;

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
        console.warn(
          `Notification created for user ID ${result.userId} but user not found for response.`
        );
        return res.status(201).json({ notification: result.toObject() });
      }
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

const getAllNotifications = async (req, res, next) => {
  const { page, limit, username } = req.query;

  try {
    const notificationData = await notificationService.getAllNotifications(
      page,
      limit,
      username
    );
    res.status(200).json(notificationData);
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  const { id } = req.params;

  try {
    await notificationService.deleteNotification(id);
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const createService = async (req, res, next) => {
  const { name, isAvailable } = req.body;

  try {
    const newService = await serviceCatalogService.createService(
      name,
      isAvailable
    );
    res.status(201).json(newService);
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  const { id } = req.params;
  const { name, isAvailable } = req.body;

  try {
    const updatedService = await serviceCatalogService.updateService(id, {
      name,
      isAvailable,
    });
    res.json(updatedService);
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  const { id } = req.params;

  try {
    await serviceCatalogService.deleteService(id);
    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getServices = async (req, res, next) => {
  try {
    const services = await serviceCatalogService.getServices();
    res.json(services);
  } catch (error) {
    next(error);
  }
};

const addPoint = async (req, res, next) => {
  const { userId, pointsToAdd } = req.body;

  try {
    const updatedUser = await userService.addPointsToUser(userId, pointsToAdd);

    res.json({
      message: "Points added successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        points: updatedUser.points,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getRates = async (req, res, next) => {
  try {
    const rates = await rateService.getRates();
    res.status(200).json(rates);
  } catch (error) {
    next(error);
  }
};

const setRates = async (req, res, next) => {
  const { withdrawalRate, depositRate } = req.body;

  try {
    const rates = await rateService.setRates(withdrawalRate, depositRate);

    return res
      .status(200)
      .json({ message: "Rates updated successfully", rates });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginAdmin,
  getAdminReferrals,
  getAdmin,
  updateAdmin,
  getAllUsers,
  getUserAnalytics,
  updateUser,
  createNotification,
  getAllNotifications,
  deleteNotification,
  createService,
  updateService,
  deleteService,
  getServices,
  addPoint,
  getRates,
  setRates,
};
