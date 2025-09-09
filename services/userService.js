const User = require('../model/User');
const Wallet = require('../model/Wallet');
const bcrypt = require('bcrypt');
const dbService = require('./dbService');
const walletService = require('./walletService');


const findUserById = async (userId) => {
  return dbService.findUserById(userId);
};

const getAdminUser = async (adminId) => {
    const user = await findUserById(adminId);
    return user;
};

const updateAdminUser = async (
  adminId,
  phoneNumber,
  newPassword,
  oldPassword
) => {
  const user = await findUserById(adminId);

  const updates = {};

  if (newPassword) {
    if (!oldPassword) {
      throw {
        status: 400,
        message: "Current password is required to change password",
      };
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw { status: 400, message: "Current password is incorrect" };
    }
    if (oldPassword === newPassword) {
      throw {
        status: 400,
        message: "New password must be different from old password",
      };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    updates.password = hashedPassword;
  }

  if (phoneNumber !== undefined) {
    updates.phoneNumber = phoneNumber;
  }

  if (Object.keys(updates).length === 0) {
    throw { status: 400, message: "No valid fields to update" };
  }

  const updatedUser = await User.findByIdAndUpdate(adminId, updates, {
    new: true,
  }).exec();
  return updatedUser;
};

const getAllUsers = async (page = 1, limit = 10, search = "", role, status) => {
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

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .exec();

  const totalCount = await User.countDocuments(query);

  return { users, totalCount };
};

const updateUser = async (userId, updateData) => {
  const user = await findUserById(userId);

  const validUpdates = {};
  let hasUpdates = false;

  if (typeof updateData.isDeleted !== "undefined") {
    validUpdates.isDeleted = updateData.isDeleted;
    hasUpdates = true;
  }

  if (!hasUpdates) {
    throw { status: 400, message: "No valid fields to update" };
  }

  const updatedUser = await User.findByIdAndUpdate(userId, validUpdates, {
    new: true,
  }).exec();
  return updatedUser;
};

const getUserAnalytics = async () => {
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

  return {
    totalUsers,
    totalActiveUsers,
    totalDeletedUsers,
    usersByRole,
  };
};

const addPointsToUser = async (userId, pointsToAdd) => {
  if (typeof pointsToAdd !== "number" || pointsToAdd <= 0) {
    throw { status: 400, message: "Invalid number of points" };
  }

  const user = await findUserById(userId);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { points: pointsToAdd } },
    { new: true }
  ).exec();

  return updatedUser;
};

const getReferralsData = async (page = 1, limit = 10, search = "") => {
  const filter = search
    ? {
        $or: [
          { username: { $regex: search.trim(), $options: "i" } },
          { email: { $regex: search.trim(), $options: "i" } },
        ],
      }
    : {};

  const totalUsers = await User.countDocuments(filter);

  const users = await User.find(filter)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit, 10))
    .populate("referredUsers", "username email")
    .select("username email points referredUsers referralCode")
    .exec();

  const formattedUsers = users.map((user) => ({
    _id: user._id,
    username: user.username,
    email: user.email,
    points: user.points,
    referredUsers: user.referredUsers.map((referee) => ({
      _id: referee._id,
      username: referee.username,
      email: referee.email,
    })),
    referralCode: user.referralCode,
    totalReferred: user.referredUsers.length,
  }));

  return {
    totalUsers,
    currentPage: parseInt(page, 10),
    totalPages: Math.ceil(totalUsers / limit),
    users: formattedUsers,
  };
};


const getUserProfile = async (userId) => {
  return findUserById(userId);
};

const updateUserProfile = async (userId, updateData) => {
  const user = await findUserById(userId);

  const updates = {};

  if (updateData.newPassword) {
    if (!updateData.oldPassword) {
      throw {
        status: 400,
        message: "Current password is required to change password",
      };
    }
    const isMatch = await bcrypt.compare(updateData.oldPassword, user.password);
    if (!isMatch) {
      throw { status: 400, message: "Current password is incorrect" };
    }
    if (updateData.oldPassword === updateData.newPassword) {
      throw {
        status: 400,
        message: "New password must be different from old password",
      };
    }

    const hashedPassword = await bcrypt.hash(updateData.newPassword, 10);
    updates.password = hashedPassword;
  }

  if (updateData.phoneNumber !== undefined) {
    updates.phoneNumber = updateData.phoneNumber;
  }

  if (typeof updateData.emailNotificationsEnabled === "boolean") {
    updates.emailNotificationsEnabled = updateData.emailNotificationsEnabled;
  }

  if (updateData.transactionPin !== undefined) {
    // Validate transaction PIN format
    if (updateData.transactionPin && !/^\d{4,6}$/.test(updateData.transactionPin)) {
      throw {
        status: 400,
        message: "Transaction PIN must be 4-6 digits",
      };
    }

    // If user already has a PIN and is changing it, verify current PIN
    if (user.transactionPin && updateData.currentTransactionPin) {
      if (user.transactionPin !== updateData.currentTransactionPin) {
        throw {
          status: 400,
          message: "Current transaction PIN is incorrect",
        };
      }
    }

    updates.transactionPin = updateData.transactionPin;
  }

  if (updateData.bankAccount) {
    const { bankName, accountNumber, bankCode, accountName } =
      updateData.bankAccount;
    if (!bankName || !accountNumber || !bankCode || !accountName) {
      throw {
        status: 400,
        message:
          "Bank name, account number, bank code, and account name are required for new account",
      };
    }

    const existingAccount = user.bankAccounts.find(
      (account) => account.accountNumber === accountNumber
    );
    if (existingAccount) {
      throw {
        status: 400,
        message: "Bank account with this number already exists",
      };
    }

    user.bankAccounts.push({
      bankName,
      accountNumber,
      bankCode,
      accountName,
    });
    updates.bankAccounts = user.bankAccounts;
  }

  if (updateData.deleteAccountNumber) {
    const accountNumberToDelete = updateData.deleteAccountNumber;
    if (!accountNumberToDelete) {
      throw {
        status: 400,
        message: "Account number to delete cannot be empty",
      };
    }

    const initialLength = user.bankAccounts.length;
    user.bankAccounts = user.bankAccounts.filter(
      (account) => account.accountNumber !== accountNumberToDelete
    );
    const accountsRemoved = initialLength - user.bankAccounts.length;

    if (accountsRemoved === 0) {
      throw { status: 404, message: "Bank account to delete not found" };
    }

    updates.bankAccounts = user.bankAccounts;
  }

  if (Object.keys(updates).length === 0) {
    throw { status: 400, message: "No valid fields to update" };
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).exec();

  return updatedUser;
};

const deleteUserBankAccount = async (userId, accountNumber) => {
  const user = await findUserById(userId);

  if (!accountNumber) {
    throw { status: 400, message: "Account number is required" };
  }

  const initialLength = user.bankAccounts.length;
  user.bankAccounts = user.bankAccounts.filter(
    (account) => account.accountNumber !== accountNumber
  );
  const accountsRemoved = initialLength - user.bankAccounts.length;

  if (accountsRemoved === 0) {
    throw { status: 404, message: "Bank account not found" };
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { bankAccounts: user.bankAccounts },
    { new: true }
  ).exec();

  return updatedUser;
};

const softDeleteUser = async (userId) => {
  const user = await findUserById(userId);

  if (user.isDeleted) {
    return { message: "Account is already deleted" };
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { isDeleted: true },
    { new: true }
  ).exec();

  return { message: "Account successfully deleted" };
};

const redeemPoints = async (userId, pointsToRedeem) => {
  if (typeof pointsToRedeem !== "number" || pointsToRedeem <= 0) {
    throw { status: 400, message: "Invalid number of points to redeem" };
  }

  const user = await findUserById(userId);

  if (user.points < pointsToRedeem) {
    throw { status: 400, message: "Insufficient points" };
  }

  const nairaToAdd = Math.floor(pointsToRedeem / 10);

  const wallet = await dbService.findWalletByUserId(userId);

  const [updatedWallet, updatedUser] = await Promise.all([
    walletService.creditWallet(wallet, nairaToAdd),
    User.findByIdAndUpdate(
      userId,
      { $inc: { points: -pointsToRedeem } },
      { new: true }
    ).exec(),
  ]);


  return {
    message: "Points redeemed successfully",
    balance: updatedWallet.balance,
    remainingPoints: updatedUser.points,
  };
};

const getUserReferrals = async (userId, page = 1, limit = 10, search = "") => {
  const user = await User.findById(userId)
    .populate({
      path: "referredUsers",
      match: search
        ? {
            $or: [
              { username: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          }
        : {},
      select: "username email createdAt",
    })
    .select("referredUsers");

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const referredUsers = user.referredUsers || [];
  const totalUsers = referredUsers.length;
  const startIndex = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const endIndex = startIndex + parseInt(limit, 10);
  const results = referredUsers.slice(startIndex, endIndex);

  return {
    totalUsers,
    currentPage: parseInt(page, 10),
    totalPages: Math.ceil(totalUsers / parseInt(limit, 10)),
    users: results.map((ref) => ({
      _id: ref._id,
      username: ref.username,
      email: ref.email,
      joinedAt: ref.createdAt,
    })),
  };
};


module.exports = {
  findUserById,
  getAdminUser,
  updateAdminUser,
  getAllUsers,
  updateUser,
  getUserAnalytics,
  addPointsToUser,
  getReferralsData,

  getUserProfile,
  updateUserProfile,
  deleteUserBankAccount,
  softDeleteUser,
  redeemPoints,
  getUserReferrals,
};