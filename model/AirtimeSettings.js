const mongoose = require("mongoose");

const airtimeSettingsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["global", "network"],
    },
    network: {
      type: String,
      enum: ["mtn", "glo", "airtel", "9mobile"],
      required: function() {
        return this.type === "network";
      }
    },
    settings: {
      minAmount: {
        type: Number,
        required: true,
        min: 0
      },
      maxAmount: {
        type: Number,
        required: true,
        min: 0
      },
      dailyLimit: {
        type: Number,
        required: true,
        min: 0
      },
      monthlyLimit: {
        type: Number,
        required: true,
        min: 0
      },
      // Commission rates for different services
      airtimeCommissionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100 // Percentage (0-100)
      },
      dataCommissionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100 // Percentage (0-100)
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Compound unique index to ensure one global document and one per network
airtimeSettingsSchema.index({ type: 1, network: 1 }, { unique: true });

const AirtimeSettings = mongoose.model("AirtimeSettings", airtimeSettingsSchema);

module.exports = AirtimeSettings;