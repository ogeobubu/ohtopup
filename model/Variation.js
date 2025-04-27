const mongoose = require('mongoose');

const VariationSchema = new mongoose.Schema({
  variation_code: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  variation_amount: {
    type: String,
    required: true,
  },
  fixedPrice: {
    type: String,
    required: true,
  },
  serviceID: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

VariationSchema.index({ variation_code: 1, serviceID: 1 }, { unique: true });

const Variation = mongoose.model('Variation', VariationSchema);
module.exports = Variation;