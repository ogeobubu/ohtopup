const User = require("../model/User");
const Wallet = require("../model/Wallet");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { randomUUID, createHash } = require("crypto");
const AuthSession = require('../model/AuthSession');
const { generateConfirmationCode } = require("../utils");
const {
  sendConfirmationEmail,
  sendVerificationEmail,
} = require("../controllers/email/sendTransactionEmailNotification");
const emailService = require("./emailService");
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

  // Convert username to lowercase and remove spaces
  const processedUsername = username.toLowerCase().replace(/\s+/g, '');

  const existingUser = await User.findOne({ $or: [{ username: processedUsername }, { email }] });

  if (existingUser) {
    throw {
      status: 400,
      message:
        existingUser.username === processedUsername
          ? "Username already exists"
          : "Email already exists",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newReferralCode = await generateUniqueReferralCode(processedUsername);

  const newUser = new User({
    username: processedUsername,
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

const loginAdminUser = async (email, password) => {
  const user = await User.findOne({ email, isDeleted: false });

  if (!user) {
    throw { status: 401, message: "Invalid email or password" };
  }

  if (user.role !== "admin") {
    throw { status: 403, message: "Access denied. Admins only." };
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw { status: 401, message: "Invalid email or password" };
  }

  const payload = { user: { id: user._id, role: user.role } };
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign(payload, secret, { expiresIn: "7d" });

  return token;
};

const hashRefreshToken = token => createHash('sha256').update(token).digest('hex');

const generateRefreshToken = (userId, familyId = randomUUID()) => {
  return jwt.sign(
    { type: 'refresh', userId: String(userId), familyId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '30d', jwtid: randomUUID() }
  );
};

const createRefreshSession = async (userId, context = {}, familyId = randomUUID()) => {
  const refreshToken = generateRefreshToken(userId, familyId);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await AuthSession.create({ userId, tokenHash: hashRefreshToken(refreshToken), familyId, expiresAt, userAgent: String(context.userAgent || '').slice(0, 300), ipAddress: String(context.ipAddress || '').slice(0, 100) });
  return { refreshToken, expiresAt, familyId };
};

const refreshAccessToken = async (refreshToken, context = {}) => {
  try {
    // Verify the refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== 'refresh') {
      throw { status: 401, message: "Invalid refresh token" };
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await AuthSession.findOne({ tokenHash }).select('+tokenHash +replacedByHash');
    if (!stored || stored.expiresAt <= new Date()) throw { status: 401, message: "Invalid or expired refresh token" };
    if (stored.revokedAt) {
      if (stored.replacedByHash) await AuthSession.updateMany({ familyId: stored.familyId, revokedAt: null }, { $set: { revokedAt: new Date(), revokeReason: 'refresh_token_reuse' } });
      throw { status: 401, message: "Refresh token reuse detected. Please sign in again." };
    }
    const user = await User.findOne({ _id: stored.userId, isDeleted: false });
    if (!user) throw { status: 401, message: "Invalid or expired refresh token" };

    if (decoded.userId && decoded.userId !== String(user._id)) {
      throw { status: 401, message: "Invalid refresh token" };
    }
    if (decoded.familyId !== stored.familyId) throw { status: 401, message: "Invalid refresh token" };

    // Generate new access token
    const payload = { user: { id: user._id, role: user.role } };
    const secret = process.env.JWT_SECRET;
    const newAccessToken = jwt.sign(payload, secret, { expiresIn: "15m" });

    // Optionally generate new refresh token (token rotation)
    const newRefreshToken = generateRefreshToken(user._id, stored.familyId);
    const newHash = hashRefreshToken(newRefreshToken);
    const rotated = await AuthSession.findOneAndUpdate({ _id: stored._id, revokedAt: null }, { $set: { revokedAt: new Date(), revokeReason: 'rotated', replacedByHash: newHash, lastUsedAt: new Date() } });
    if (!rotated) {
      await AuthSession.updateMany({ familyId: stored.familyId, revokedAt: null }, { $set: { revokedAt: new Date(), revokeReason: 'refresh_token_reuse' } });
      throw { status: 401, message: "Refresh token reuse detected. Please sign in again." };
    }
    await AuthSession.create({ userId: user._id, tokenHash: newHash, familyId: stored.familyId, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), userAgent: String(context.userAgent || stored.userAgent || '').slice(0, 300), ipAddress: String(context.ipAddress || stored.ipAddress || '').slice(0, 100) });

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw { status: 401, message: "Invalid refresh token" };
    }
    if (error.name === 'TokenExpiredError') {
      throw { status: 401, message: "Refresh token expired" };
    }
    throw error;
  }
};

const loginUser = async (email, password, context = {}) => {
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

  // Generate access token
  const payload = { user: { id: user._id, role: user.role } };
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign(payload, secret, { expiresIn: "15m" }); // Shorter expiration for access token

  // Generate refresh token
  const { refreshToken } = await createRefreshSession(user._id, context);
  await User.updateOne({ _id: user._id }, { $unset: { refreshToken: 1, refreshTokenExpires: 1 } });

  return {
    message: "Login successful!",
    token,
    refreshToken
  };
};

const listSessions = async userId => AuthSession.find({ userId, revokedAt: null, expiresAt: { $gt: new Date() } }).select('_id userAgent ipAddress createdAt lastUsedAt expiresAt').sort({ lastUsedAt: -1 }).lean();

const revokeSession = async (userId, sessionId) => {
  const result = await AuthSession.updateOne({ _id: sessionId, userId, revokedAt: null }, { $set: { revokedAt: new Date(), revokeReason: 'user_revoked' } });
  if (!result.matchedCount) throw { status: 404, message: 'Active session not found' };
  return { message: 'Session revoked' };
};

const revokeAllSessions = async userId => {
  const result = await AuthSession.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date(), revokeReason: 'user_revoked_all' } });
  return { message: 'All sessions revoked', revokedCount: result.modifiedCount };
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

  await emailService.sendPasswordResetEmail(email, user.username, otp);
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

  await emailService.sendPasswordResetEmail(user.email, user.username, user.otp);

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
  loginAdminUser,
  refreshAccessToken,
  listSessions,
  revokeSession,
  revokeAllSessions,
};
