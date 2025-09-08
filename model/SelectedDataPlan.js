const mongoose = require("mongoose");

const selectedDataPlanSchema = new mongoose.Schema(
  {
    // Reference to the provider
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },
    providerName: {
      type: String,
      required: true,
      enum: ["vtpass", "clubkonnect"],
    },

    // Plan details from the provider
    planId: {
      type: String,
      required: true,
    },
    serviceId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    dataAmount: {
      type: String,
      required: true,
    },
    validity: {
      type: String,
      required: true,
    },
    network: {
      type: String,
      required: true,
      enum: ["MTN", "Airtel", "Glo", "9mobile", "mtn", "airtel", "glo", "9MOBILE", "AIRTEL", "GLO", "MTN"],
    },
    planType: {
      type: String,
      enum: ["SME", "Regular", "Direct", "Awoof", "Daily", "Weekly", "Monthly"],
      default: "Regular",
    },

    // Admin settings
    isActive: {
      type: Boolean,
      default: true,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0,
    },

    // Pricing override (optional)
    adminPrice: {
      type: Number,
      default: null, // If null, use provider price
    },
    discount: {
      type: Number,
      default: 0, // Percentage discount
    },

    // Metadata
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    selectedBy: {
      type: String,
      default: "admin",
    },
  },
  { timestamps: true }
);

// Compound index to ensure unique plans per provider
selectedDataPlanSchema.index({ provider: 1, planId: 1 }, { unique: true });

// Index for efficient queries
selectedDataPlanSchema.index({ isActive: 1, isVisible: 1 });
selectedDataPlanSchema.index({ network: 1 });
selectedDataPlanSchema.index({ priority: -1 });
selectedDataPlanSchema.index({ providerName: 1 });

const SelectedDataPlan = mongoose.model("SelectedDataPlan", selectedDataPlanSchema);

module.exports = SelectedDataPlan;