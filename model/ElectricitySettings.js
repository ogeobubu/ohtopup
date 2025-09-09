const mongoose = require("mongoose");

const electricitySettingsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["global", "disco"],
    },
    disco: {
      type: String,
      enum: ["ikeja", "eko", "abuja", "ibadan", "enugu", "port", "kano", "jos", "kaduna", "benin", "yola"],
      required: function() {
        return this.type === "disco";
      }
    },
    settings: {
      // Commission rate for electricity purchases
      electricityCommissionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 50 // Percentage (0-50)
      },
      // Amount limits for electricity purchases
      minAmount: {
        type: Number,
        default: 1000,
        min: 100,
        max: 100000
      },
      maxAmount: {
        type: Number,
        default: 50000,
        min: 1000,
        max: 500000
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Compound unique index to ensure one global document and one per disco
electricitySettingsSchema.index({ type: 1, disco: 1 }, { unique: true });

const ElectricitySettings = mongoose.model("ElectricitySettings", electricitySettingsSchema);

module.exports = ElectricitySettings;