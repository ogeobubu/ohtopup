const User = require("../model/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateConfirmationCode } = require("../utils");
const { sendForgotPasswordEmail } = require("./email/sendForgotPasswordEmail");
const { sendConfirmationEmail } = require("./email/sendConfirmationEmail");
const { sendVerificationEmail } = require("./email/sendVerificationEmail");
const { sendResendResetOTPEmail } = require("./email/sendResendResetOTPEmail");

const createUser = async (req, res) => {
  const { username, email, phoneNumber, referralCode, password, source } =
    req.body;

  if (!username || !email || !phoneNumber || !password) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: "Username already exists" });
      } else {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      phoneNumber,
      referralCode,
      password: hashedPassword,
      source,
    });

    await newUser.save();

    const confirmationCode = Math.floor(Math.random() * 9000) + 1000;
    newUser.confirmationCode = confirmationCode;
    newUser.confirmationCodeExpires = Date.now() + 3600000;

    await User.updateOne(
      { _id: newUser._id },
      { confirmationCode: newUser.confirmationCode },
      { confirmationCodeExpires: newUser.confirmationCodeExpires }
    );

    await newUser.save();

    await sendConfirmationEmail(newUser.email, username, confirmationCode);

    res.status(201).json({
      message:
        "User created successfully! Please verify your email to activate your account.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating user", error });
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
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });

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

module.exports = {
  createUser,
  verifyUser,
  resendVerificationCode,
  loginUser,
  forgotPassword,
  verifyOtpAndResetPassword,
  resendOtp,
  getUser,
  updateUser,
  softDeleteUser,
};
