const User = require("../model/User");
const Wallet = require("../model/Wallet");

const { handleServiceError } = require('../middleware/errorHandler');

const authService = require('../services/authService');
const userService = require('../services/userService');
const paymentGatewayService = require('../services/paymentGatewayService');


const createUser = async (req, res, next) => {
  const userData = req.body;

  try {
    const result = await authService.createUser(userData);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getReferrals = async (req, res, next) => {
  const userId = req.user.id;
  const { page, limit, search } = req.query;

  try {
    const referralData = await userService.getUserReferrals(userId, page, limit, search);
    return res.status(200).json(referralData);
  } catch (error) {
    next(error);
  }
};

const verifyUser = async (req, res, next) => {
  const { confirmationCode } = req.body;

  try {
    const result = await authService.verifyUser(confirmationCode);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const resendVerificationCode = async (req, res, next) => {
  const { email } = req.body;

  try {
    const result = await authService.resendVerificationCode(email);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const result = await authService.loginUser(email, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const verifyOtpAndResetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  try {
    const result = await authService.verifyOtpAndResetPassword(email, otp, newPassword);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  const { email } = req.body;

  try {
    const result = await authService.resendOtp(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const user = await userService.getUserProfile(userId);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  const userId = req.user.id;
  const updateData = req.body;

  try {
    const updatedUser = await userService.updateUserProfile(userId, updateData);
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

const deleteBankAccount = async (req, res, next) => {
  const userId = req.user.id;
  const { accountNumber } = req.body;

  try {
    const updatedUser = await userService.deleteUserBankAccount(userId, accountNumber);

    return res.status(200).json({
      message: "Bank account deleted successfully",
      bankAccounts: updatedUser.bankAccounts,
    });
  } catch (error) {
    next(error);
  }
};

const softDeleteUser = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const result = await userService.softDeleteUser(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const verifyBankAccount = async (req, res, next) => {
  const { accountNumber, bankCode } = req.body;

  try {
    const verificationResult = await paymentGatewayService.verifyBankAccount(accountNumber, bankCode);

    return res.status(200).json(verificationResult);
  } catch (error) {
    next(error);
  }
};

const redeemPoints = async (req, res, next) => {
  const { pointsToRedeem } = req.body;
  const userId = req.user.id;

  try {
    const result = await userService.redeemPoints(userId, pointsToRedeem);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getReferrals,
  verifyUser,
  resendVerificationCode,
  loginUser,
  forgotPassword,
  verifyOtpAndResetPassword,
  resendOtp,
  getUser,
  updateUser,
  softDeleteUser,
  deleteBankAccount,
  verifyBankAccount,
  redeemPoints,
};