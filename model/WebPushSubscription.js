const mongoose = require("mongoose");

const webPushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, default: "" },
      auth: { type: String, default: "" },
    },
    userAgent: { type: String },
  },
  { timestamps: true }
);

// One subscription per user+endpoint
webPushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

module.exports = mongoose.model("WebPushSubscription", webPushSubscriptionSchema);
