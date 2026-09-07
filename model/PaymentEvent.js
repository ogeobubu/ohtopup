const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'review'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  nextAttemptAt: { type: Date, default: Date.now },
  leaseUntil: Date,
  leaseToken: String,
  lastError: String,
}, { timestamps: true });
schema.index({ status: 1, nextAttemptAt: 1 });
module.exports = mongoose.model('PaymentEvent', schema);
