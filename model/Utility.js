const mongoose = require("mongoose");

const utilitySchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
    },
    serviceID: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "delivered"],
      default: "pending",
    },
    type: {
      type: String,
      required: true,
    },
    product_name: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    revenue: {
      type: Number,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    token: {
      type: String,
    },
    units: {
      type: String,
    },
    discount: {
      type: Number,
      default: 0,
    },
    commissionRate: {
      type: Number,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
    },
    category: {
      type: String,
    },
  },
  { timestamps: true }
);

const Utility = mongoose.model("Utility", utilitySchema);

module.exports = Utility;