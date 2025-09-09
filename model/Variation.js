const mongoose = require('mongoose');

const VariationSchema = new mongoose.Schema({
  variation_code: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  variation_amount: {
    type: String,
    required: true
  },
  fixedPrice: {
    type: String,
    required: true
  },
  serviceID: {
    type: String,
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
}, {
  timestamps: true,
  autoIndex: true
});

// Indexes are automatically created for fields with index: true

module.exports = mongoose.model('Variation', VariationSchema);