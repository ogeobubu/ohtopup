const mongoose = require('mongoose');

const emailJobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true, index: true },
  to: { type: String, required: true },
  subject: { type: String, required: true },
  html: String,
  text: String,
  emailType: { type: String, default: 'general' },
  status: { type: String, enum: ['queued', 'processing', 'sent', 'failed'], default: 'queued', index: true },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  nextAttemptAt: { type: Date, default: Date.now, index: true },
  leaseUntil: Date,
  lastError: String,
  sentAt: Date,
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
}, { timestamps: true });

emailJobSchema.index({ status: 1, nextAttemptAt: 1, createdAt: 1 });

module.exports = mongoose.models.EmailJob || mongoose.model('EmailJob', emailJobSchema);
