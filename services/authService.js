const User = require("../model/User");
const Wallet = require("../model/Wallet");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateConfirmationCode } = require("../utils");
const {
  sendConfirmationEmail,
  sendVerificationEmail,
  sendLoginNotificationEmail,
  sendForgotPasswordEmail,
  sendResendResetOTPEmail,
} = require("../controllers/email/sendTransactionEmailNotification");
const dbService = require("./dbService");
const walletService = require("./walletService");

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

const createUser = async (userData) => {
  const { username, email, phoneNumber, password, source, referrerCode } =
    userData;

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existingUser) {
    throw {
      status: 400,
      message:
        existingUser.username === username
          ? "Username already exists"
          : "Email already exists",
    };
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
    referrerCode,
  });

  await newUser.save();

  const wallet = new Wallet({ userId: newUser._id });
  await wallet.save();

  if (referrerCode) {
    const referrer = await User.findOne({ referralCode: referrerCode });
    if (referrer) {
      referrer.referredUsers.push(newUser._id);
      await referrer.save();
    }
  }

  const confirmationCode = Math.floor(Math.random() * 9000) + 1000;
  newUser.confirmationCode = confirmationCode;
  newUser.confirmationCodeExpires = Date.now() + 3600000;

  await User.updateOne(
    { _id: newUser._id },
    {
      confirmationCode: newUser.confirmationCode,
      confirmationCodeExpires: newUser.confirmationCodeExpires,
    }
  );

  await sendConfirmationEmail(newUser.email, username, confirmationCode);

  return {
    message:
      "User created successfully! Please verify your email to activate your account.",
  };
};

const verifyUser = async (confirmationCode) => {
  const user = await User.findOne({
    confirmationCode,
    confirmationCodeExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw { status: 400, message: "Invalid or expired confirmation code" };
  }

  user.isVerified = true;
  user.confirmationCode = null;
  user.confirmationCodeExpires = null;

  await User.updateOne(
    { _id: user._id },
    {
      isVerified: user.isVerified,
      confirmationCode: user.confirmationCode,
      confirmationCodeExpires: user.confirmationCodeExpires,
    }
  );

  return { message: "Email verified successfully!" };
};

const resendVerificationCode = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  if (user.confirmationCodeExpires > Date.now()) {
    throw {
      status: 400,
      message: "Confirmation code is still valid. Please check your email.",
    };
  }

  const newConfirmationCode = generateConfirmationCode();
  user.confirmationCode = newConfirmationCode;
  user.confirmationCodeExpires = Date.now() + 3600000;

  await User.updateOne(
    { _id: user._id },
    {
      confirmationCode: user.confirmationCode,
      confirmationCodeExpires: user.confirmationCodeExpires,
    }
  );

  await sendVerificationEmail(user.username, user.email, newConfirmationCode);

  return { message: "New confirmation code sent to your email." };
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email, isDeleted: false });

  if (!user) {
    throw { status: 401, message: "Invalid email or password" };
  }

  if (!user.isVerified) {
    throw {
      status: 401,
      message:
        "Email verification required. Please check your email and verify to login.",
    };
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw { status: 401, message: "Invalid email or password" };
  }

  await sendLoginNotificationEmail(user.email);

  const payload = { user: { id: user._id, role: user.role } };
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign(payload, secret, { expiresIn: "1d" });

  return { message: "Login successful!", token };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 15 * 60 * 1000;

  await User.updateOne(
    { _id: user._id },
    { otp: user.otp, otpExpires: user.otpExpires }
  );

  await sendForgotPasswordEmail(email, user, user.username);
  return { message: "OTP sent to your email." };
};

const verifyOtpAndResetPassword = async (email, otp, newPassword) => {
  const user = await User.findOne({ email, otp });

  if (!user || user.otpExpires < Date.now()) {
    throw { status: 400, message: "Invalid or expired OTP." };
  }

  const hashPassword = await bcrypt.hash(newPassword, 10);

  await User.updateOne(
    { _id: user._id },
    { password: hashPassword, otp: undefined, otpExpires: undefined }
  );

  return { message: "Password has been updated successfully." };
};

const resendOtp = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw { status: 404, message: "User not found." };
  }

  if (user.otp && user.otpExpires > Date.now()) {
    // Optional: Prevent resending if current OTP is still valid for some time
    // throw { status: 400, message: "An OTP has already been sent. Please wait." };
  }

  const otp = Math.floor(1000 + Math.random() * 9000);
  user.otp = otp;
  user.otpExpires = Date.now() + 15 * 60 * 1000;

  const updateResult = await User.updateOne(
    { _id: user._id },
    { otp: user.otp, otpExpires: user.otpExpires }
  );

  if (updateResult.modifiedCount === 0) {
    // Use modifiedCount for outcome check
    throw { status: 500, message: "Failed to update OTP." };
  }

  await sendResendResetOTPEmail(user.username, user.email, user.otp);

  return { message: "OTP resent successfully." };
};

module.exports = {
  createUser,
  verifyUser,
  resendVerificationCode,
  loginUser,
  forgotPassword,
  verifyOtpAndResetPassword,
  resendOtp,
};
