const User = require("../model/User");
const Notification = require("../model/Notification");
const Service = require("../model/Service");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, isDeleted: false });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const payload = { user: { id: user._id, role: user.role } };
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(payload, secret, { expiresIn: "1d" });

    res.status(200).json({ message: "Login successful!", token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const getAdminReferrals = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const filter = search
      ? {
          $or: [
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const totalUsers = await User.countDocuments(filter);
    const users = await User.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10))
      .populate("referredUsers", "username email")
      .select("username email points referredUsers");

    return res.status(200).json({
      totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      users: users.map((user) => ({
        _id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        referredUsers: user.referredUsers,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const { phoneNumber, newPassword, oldPassword } = req.body;
    const updates = {};

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      if (oldPassword === newPassword) {
        return res.status(400).json({
          message: "New password must be different from old password",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.password = hashedPassword;
    }

    if (phoneNumber) {
      updates.phoneNumber = phoneNumber;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllUsers = async (req, res) => {
  const { page = 1, limit = 10, search = "", role, status } = req.query;

  const query = {};

  if (status === "all") {
  } else if (status === "deleted") {
    query.isDeleted = true;
  } else {
    query.isDeleted = false;
  }

  if (role) {
    query.role = role;
  }

  if (search) {
    const searchRegex = new RegExp(search.trim(), "i");
    query.$or = [
      { username: { $regex: searchRegex } },
      { email: { $regex: searchRegex } },
    ];
  }

  try {
    const users = await User.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const totalCount = await User.countDocuments(query);

    res.status(200).json({ users, totalCount });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const updateUser = async (req, res) => {
  try {
    const { isDeleted } = req.body;
    const updates = {};

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (typeof isDeleted !== "undefined") {
      updates.isDeleted = isDeleted;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const totalActiveUsers = await User.countDocuments({ isDeleted: false });

    const totalDeletedUsers = await User.countDocuments({ isDeleted: true });

    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      totalUsers,
      totalActiveUsers,
      totalDeletedUsers,
      usersByRole,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const createNotification = async (req, res) => {
  const { userId, type, message, link } = req.body;

  try {
    let notifications = [];

    if (userId === "all") {
      const users = await User.find().select("username email");

      // Create a notification for each user
      for (const user of users) {
        const notification = new Notification({
          userId: user._id,
          type,
          message,
          link,
        });
        await notification.save();
        notifications.push({
          ...notification.toObject(),
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
          },
        });
      }
      return res.status(201).json({
        message: `${notifications.length} notifications sent to all users.`,
        notifications,
      });
    } else {
      const notification = new Notification({ userId, type, message, link });
      await notification.save();

      const user = await User.findById(userId).select("username email");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(201).json({
        notification: {
          ...notification.toObject(),
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
          },
        },
      });
    }
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate("userId", "username email")
      .sort({ createdAt: -1 });

    const formattedNotifications = notifications.map((notification) => ({
      id: notification._id,
      user: {
        id: notification.userId._id,
        username: notification.userId.username,
        email: notification.userId.email,
      },
      type: notification.type,
      message: notification.message,
      createdAt: notification.createdAt,
    }));

    res.status(200).json(formattedNotifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

const deleteNotification = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedNotification = await Notification.findByIdAndDelete(id);

    if (!deletedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

const createService = async (req, res) => {
  const { name, isAvailable } = req.body;

  try {
    const newService = new Service({ name, isAvailable });
    await newService.save();
    res.status(201).json(newService);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateService = async (req, res) => {
  const { id } = req.params;
  const { name, isAvailable } = req.body;

  try {
    const updatedService = await Service.findByIdAndUpdate(
      id,
      { name, isAvailable },
      { new: true, runValidators: true }
    );
    if (!updatedService) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json(updatedService);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteService = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedService = await Service.findByIdAndDelete(id);
    if (!deletedService) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addPoint = async (req, res) => {
  const { userId, pointsToAdd } = req.body;

  try {
    if (!userId || typeof pointsToAdd !== "number" || pointsToAdd <= 0) {
      return res.status(400).json({ message: "Invalid user ID or points" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.points += pointsToAdd;

    const updatedUser = await user.save();

    res.json({
      message: "Points added successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        points: updatedUser.points,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
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
};
