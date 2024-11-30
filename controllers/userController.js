const User = require("../model/User");
const Wallet = require("../model/Wallet");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateConfirmationCode } = require("../utils");
const { sendForgotPasswordEmail } = require("./email/sendForgotPasswordEmail");
const { sendConfirmationEmail } = require("./email/sendConfirmationEmail");
const { sendVerificationEmail } = require("./email/sendVerificationEmail");
const { sendResendResetOTPEmail } = require("./email/sendResendResetOTPEmail");
const axios = require("axios");

const generateUniqueReferralCode = async (username) => {
  let code;
  let isUnique = false;

  while (!isUnique) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    code = `${username}-${randomSuffix}`;
    const existingUser = await User.findOne({ referralCode: code });
    isUnique = !existingUser;
  }

  return code;
};

const createUser = async (req, res) => {
  const { username, email, phoneNumber, referralCode, password, source } = req.body;

  if (!username || !email || !phoneNumber || !password) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      return res.status(400).json({ message: existingUser.username === username ? "Username already exists" : "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newReferralCode = await generateUniqueReferralCode(username);

    const newUser = new User({
      username,
      email,
      phoneNumber,
      referralCode: newReferralCode,
      password: hashedPassword,
      source,
    });

    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
    
      if (referralCode) {
        const referrer = await User.findOne({ referralCode });
      
        if (referrer) {
          newUser.referrerId = referrer._id;
          referrer.referredUsers.push(newUser._id);
          referrer.referralCount += 1;
          referrer.points += 1;
      
          await referrer.save();
        } else {
          return res.status(400).json({ message: "Invalid referral code" });
        }
      }
    }

    await newUser.save();

    const confirmationCode = Math.floor(Math.random() * 9000) + 1000;
    newUser.confirmationCode = confirmationCode;
    newUser.confirmationCodeExpires = Date.now() + 3600000;

    await User.updateOne({ _id: newUser._id }, { confirmationCode: newUser.confirmationCode, confirmationCodeExpires: newUser.confirmationCodeExpires });
    await sendConfirmationEmail(newUser.email, username, confirmationCode);

    const wallet = new Wallet({ userId: newUser._id });
    await wallet.save();

    res.status(201).json({ message: "User created successfully! Please verify your email to activate your account." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating user", error });
  }
};

const getReferrals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, search = '' } = req.query;

    const user = await User.findById(userId).populate({
      path: 'referredUsers',
      match: {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const referredUsers = user.referredUsers || [];
    const totalUsers = referredUsers.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit, 10);
    const results = referredUsers.slice(startIndex, endIndex);

    return res.status(200).json({
      totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      users: results,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const verifyUser = async (req, res) => {
  const { confirmationCode } = req.body;

  try {
    const user = await User.findOne({
      confirmationCode,
      confirmationCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired confirmation code" });
    }

    user.isVerified = true;
    user.confirmationCode = null;
    user.confirmationCodeExpires = null;

    await User.updateOne(
      { _id: user._id },
      { isVerified: user.isVerified },
      { confirmationCode: user.confirmationCode },
      { confirmationCodeExpires: user.confirmationCodeExpires }
    );

    await user.save();

    res.json({ message: "Email verified successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.confirmationCodeExpires > Date.now()) {
      return res.status(400).json({
        message: "Confirmation code is still valid. Please check your email.",
      });
    }

    const newConfirmationCode = generateConfirmationCode();
    user.confirmationCode = newConfirmationCode;
    user.confirmationCodeExpires = Date.now() + 3600000;

    await User.updateOne(
      { _id: user._id },
      {
        confirmationCode: user.confirmationCode,
      },
      { confirmationCodeExpires: user.confirmationCodeExpires }
    );

    await user.save();

    await sendVerificationEmail(user.username, user.email, newConfirmationCode);

    res.json({ message: "New confirmation code sent to your email." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, isDeleted: false });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        message:
          "Email verification required. Please check your email and verify to login.",
      });
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

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 15 * 60 * 1000;

    await User.updateOne(
      { _id: user._id },
      { otp: user.otp, otpExpires: user.otpExpires }
    );

    await sendForgotPasswordEmail(user, user.username);
    res.status(200).json({ message: "OTP sent to your email." });
  } catch (error) {
    res.status(500).json({ message: "Error sending OTP", error });
  }
};

const verifyOtpAndResetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email, otp });

    if (!user || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);

    await User.updateOne(
      { _id: user._id },
      { password: hashPassword },
      { otp: undefined, otpExpires: undefined }
    );

    await user.save();
    res
      .status(200)
      .json({ message: "Password has been updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password", error });
  }
};

const resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const otp = Math.floor(1000 + Math.random() * 9000);
    user.otp = otp;
    user.otpExpires = Date.now() + 15 * 60 * 1000;

    const updateResult = await User.updateOne(
      { _id: user._id },
      { otp: user.otp },
      { otpExpires: user.otpExpires }
    );

    if (updateResult.nModified === 0) {
      return res.status(500).json({ message: "Failed to update OTP." });
    }

    await sendResendResetOTPEmail(user.username, user.email, user.otp);

    res.status(200).json({ message: "OTP resent successfully." });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res
      .status(500)
      .json({ message: "Error resending OTP", error: error.message });
  }
};

const getUser = async (req, res) => {
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

const updateUser = async (req, res) => {
  try {
    const {
      phoneNumber,
      newPassword,
      oldPassword,
      emailNotificationsEnabled,
      bankAccount,
      deleteAccountNumber,
    } = req.body;
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

    if (typeof emailNotificationsEnabled === "boolean") {
      updates.emailNotificationsEnabled = emailNotificationsEnabled;
    }

    if (bankAccount) {
      const { bankName, accountNumber, bankCode, accountName } = bankAccount;
      if (!bankName || !accountNumber || !bankCode || !accountName) {
        return res
          .status(400)
          .json({ message: "Bank name and account number are required" });
      }

      const existingAccount = user.bankAccounts.find(
        (account) => account.accountNumber === accountNumber
      );
      if (existingAccount) {
        return res.status(400).json({ message: "Bank account already exists" });
      }

      user.bankAccounts.push({
        bankName,
        accountNumber,
        bankCode,
        accountName,
      });
      updates.bankAccounts = user.bankAccounts;
    }

    if (deleteAccountNumber) {
      if (!deleteAccountNumber) {
        return res
          .status(400)
          .json({ message: "Account number to delete cannot be null" });
      }

      const initialLength = user.bankAccounts.length;
      user.bankAccounts = user.bankAccounts.filter(
        (account) => account.accountNumber !== deleteAccountNumber
      );
      const accountsRemoved = initialLength - user.bankAccounts.length;

      if (accountsRemoved > 0) {
        updates.bankAccounts = user.bankAccounts;
      }
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

const deleteBankAccount = async (req, res) => {
  const { accountNumber } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!accountNumber) {
      return res.status(400).json({ message: "Account number is required" });
    }

    const accountIndex = user.bankAccounts.findIndex(
      (account) => account.accountNumber === accountNumber
    );

    if (accountIndex === -1) {
      return res.status(404).json({ message: "Bank account not found" });
    }

    user.bankAccounts.splice(accountIndex, 1);

    await user.save();

    return res.status(200).json({
      message: "Bank account deleted successfully",
      bankAccounts: user.bankAccounts,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error deleting bank account", error: error.message });
  }
};

const softDeleteUser = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findByIdAndUpdate(userId, { isDeleted: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Account successfully deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const verifyBankAccount = async (req, res) => {
  const { accountNumber, bankCode } = req.body;

  try {
    const response = await axios.get(`https://api.paystack.co/bank/resolve`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      params: {
        account_number: accountNumber,
        bank_code: bankCode,
      },
    });

    return res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    if (error.response) {
      console.log(error.response);
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || "Error verifying account.",
      });
    }
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const redeemPoints = async (req, res) => {
  const { pointsToRedeem } = req.body; 
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.points < pointsToRedeem) {
      return res.status(400).json({ message: "Insufficient points" });
    }

    const nairaToAdd = Math.floor(pointsToRedeem / 10);

    let wallet = await Wallet.findOne({ userId: userId });
    if (!wallet) {
      wallet = new Wallet({ userId: userId, balance: 0 });
    }

    wallet.balance += nairaToAdd;
    user.points -= pointsToRedeem;

    await Promise.all([
      wallet.save(),
      user.save(),
    ]);

    res.status(200).json({
      message: "Points redeemed successfully",
      balance: wallet.balance,
      remainingPoints: user.points,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

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
  redeemPoints
};
