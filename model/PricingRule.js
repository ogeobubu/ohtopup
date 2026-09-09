const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  provider: { type: String, enum: ['vtpass', 'clubkonnect'], required: true },
  service: { type: String, enum: ['airtime', 'data', 'cable', 'electricity'], required: true },
  network: { type: String, default: '*' },
  planCode: { type: String, default: '' },
  providerCommissionType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
  providerCommissionRate: { type: Number, required: true, min: 0 },
  providerCommissionCap: { type: Number, default: null, min: 0 },
  customerDiscountRate: { type: Number, required: true, min: 0, max: 99.99 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
schema.index({ provider: 1, service: 1, network: 1, planCode: 1 }, { unique: true });
module.exports = mongoose.model('PricingRule', schema);
