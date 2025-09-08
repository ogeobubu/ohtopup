const mongoose = require("mongoose");

const userRewardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reward",
      required: true,
    },
    status: {
      type: String,
      enum: ["assigned", "redeemed", "expired", "cancelled"],
      default: "assigned",
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    redemptionCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    // Store reward details at time of assignment for historical accuracy
    rewardSnapshot: {
      name: { type: String, required: true },
      type: { type: String, required: true },
      value: { type: mongoose.Schema.Types.Mixed, required: true },
      unit: { type: String, required: true },
    },
  },
  { timestamps: true }
);

// Index for efficient queries
userRewardSchema.index({ user: 1, status: 1 });
userRewardSchema.index({ reward: 1 });
userRewardSchema.index({ redemptionCode: 1 });
userRewardSchema.index({ expiresAt: 1 });

const UserReward = mongoose.model("UserReward", userRewardSchema);

module.exports = UserReward;