const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  familyId: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  lastUsedAt: { type: Date, default: Date.now },
  revokedAt: Date,
  revokeReason: String,
  replacedByHash: { type: String, select: false },
  userAgent: { type: String, maxlength: 300 },
  ipAddress: { type: String, maxlength: 100 },
}, { timestamps: true });

schema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });
module.exports = mongoose.model('AuthSession', schema);
