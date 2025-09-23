const mongoose = require("mongoose");

const pushTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    token: { type: String, required: true },
    platform: { type: String, required: true, enum: ['ios', 'android'] },
  },
  { timestamps: true }
);

// Create compound index to ensure unique token per user per platform
pushTokenSchema.index({ userId: 1, platform: 1 }, { unique: true });

const PushToken = mongoose.model("PushToken", pushTokenSchema);
module.exports = PushToken;