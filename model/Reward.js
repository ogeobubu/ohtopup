const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["discount", "bonus", "points", "badge", "custom"],
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed, // Can be number (for discount/bonus) or string (for custom)
      required: true,
    },
    unit: {
      type: String,
      enum: ["percentage", "amount", "points", "text"],
      default: "percentage",
    },
    rank: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    autoAssign: {
      type: Boolean,
      default: true, // Automatically assign when user reaches this rank
    },
    maxRedemptions: {
      type: Number,
      default: null, // null means unlimited
    },
    currentRedemptions: {
      type: Number,
      default: 0,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      default: null,
    },
    conditions: {
      minTransactions: {
        type: Number,
        default: 0,
      },
      minPoints: {
        type: Number,
        default: 0,
      },
      minAmount: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }
);

// Index for efficient queries
rewardSchema.index({ rank: 1, isActive: 1 });
rewardSchema.index({ type: 1 });

const Reward = mongoose.model("Reward", rewardSchema);

module.exports = Reward;