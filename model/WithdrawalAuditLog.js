const mongoose = require("mongoose");

const withdrawalAuditLogSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    oldStatus: {
      type: String,
      enum: ["pending", "approved", "processing", "completed", "rejected", "failed"],
      required: true,
    },
    newStatus: {
      type: String,
      enum: ["pending", "approved", "processing", "completed", "rejected", "failed"],
      required: true,
    },
    action: {
      type: String,
      enum: ["approve", "reject", "process", "complete", "fail", "retry", "cancel"],
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      bankCode: String,
    },
    gatewayReference: {
      type: String,
      trim: true,
      default: null,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: null,
    },
    userAgent: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
withdrawalAuditLogSchema.index({ transactionId: 1, createdAt: -1 });
withdrawalAuditLogSchema.index({ adminId: 1, createdAt: -1 });
withdrawalAuditLogSchema.index({ userId: 1, createdAt: -1 });
withdrawalAuditLogSchema.index({ action: 1, createdAt: -1 });

const WithdrawalAuditLog = mongoose.model("WithdrawalAuditLog", withdrawalAuditLogSchema);

module.exports = WithdrawalAuditLog;