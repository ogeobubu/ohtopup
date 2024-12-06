const mongoose = require('mongoose');

const VariationSchema = new mongoose.Schema({
  variation_code: {
    type: String,
    required: true,
    unique: true,
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

const Variation = mongoose.model('Variation', VariationSchema);
module.exports = Variation;