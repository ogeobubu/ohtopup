const mongoose = require("mongoose");

const bankAccountSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v) => /^\d{10,}$/.test(v),
        message: (props) => `${props.value} is not a valid account number!`,
      },
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    bankCode: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// User Schema
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, "Please enter a valid email address"],
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: (v) => /^\+\d{1,3}\d{9,15}$/.test(v),
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    referralCode: {
      type: String,
      trim: true,
      default: null,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    confirmationCode: {
      type: String,
      default: null,
    },
    confirmationCodeExpires: {
      type: Date,
      default: null,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    phoneNumberVerified: {
      type: Boolean,
      default: false,
    },
    phoneNumberVerificationCode: {
      type: String,
      default: null,
    },
    phoneNumberVerificationCodeExpires: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    emailNotificationsEnabled: {
      type: Boolean,
      default: false,
    },
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    referredUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    referralCount: {
      type: Number,
      default: 0,
    },
    points: {
      type: Number,
      default: 0,
    },
    weeklyPoints: {
      type: Number,
      default: 0,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    bankAccounts: [bankAccountSchema],
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ username: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;