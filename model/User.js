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

const userSchema = new mongoose.Schema(
  {
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
      required: function() {
        return !this.googleId; // Phone number required only if not using Google OAuth
      },
      unique: true,
      sparse: true,
      trim: true,
      validate: {
        validator: function(v) {
          if (this.googleId) return true; // Skip validation for OAuth users
          return /^\+\d{1,3}\d{9,15}$/.test(v);
        },
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
      required: function() {
        return !this.googleId; // Password required only if not using Google OAuth
      },
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
    totalPoints: {
      type: Number,
      default: 0,
    },
    weeklyPoints: {
      type: Number,
      default: 0,
    },
    weeklyTransactions: {
      type: Number,
      default: 0,
    },
    totalReferralPoints: {
      type: Number,
      default: 0,
    },
    achievements: [{
      type: {
        type: String,
        required: true,
      },
      points: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      amount: {
        type: Number,
        default: 0,
      },
    }],
    referralDepositMap: {
      type: Map,
      of: Boolean,
    },
    bankAccounts: [bankAccountSchema],
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    transactionPin: {
      type: String,
      default: null,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow null/empty
          return /^\d{4,6}$/.test(v); // 4-6 digit PIN
        },
        message: 'Transaction PIN must be 4-6 digits'
      }
    },
  },
  { timestamps: true }
);

// Indexes are automatically created for unique fields

const User = mongoose.model("User", userSchema);

module.exports = User;