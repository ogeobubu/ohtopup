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

VariationSchema.index(
  { variation_code: 1, serviceID: 1 }, 
  { unique: true }
);

VariationSchema.index(
  { serviceID: 1, isActive: 1 }
);

module.exports = mongoose.model('Variation', VariationSchema);