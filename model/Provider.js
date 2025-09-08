const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ["vtpass", "clubkonnect"],
    },
    displayName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    credentials: {
      userId: {
        type: String,
        default: null,
      },
      apiKey: {
        type: String,
        required: true,
      },
      secretKey: {
        type: String,
        default: null,
      },
      publicKey: {
        type: String,
        default: null,
      },
    },
    baseUrl: {
      type: String,
      required: true,
    },
    endpoints: {
      walletBalance: String,
      dataPurchase: String,
      airtimePurchase: String,
      cablePurchase: String,
      electricityPurchase: String,
      queryTransaction: String,
      cancelTransaction: String,
      dataPlans: String,
      serviceVariations: String,
    },
    supportedServices: [{
      type: String,
      enum: ["data", "airtime", "cable", "electricity"],
    }],
    rateLimits: {
      requestsPerMinute: {
        type: Number,
        default: 60,
      },
      requestsPerHour: {
        type: Number,
        default: 1000,
      },
    },
    healthStatus: {
      type: String,
      enum: ["healthy", "degraded", "down"],
      default: "healthy",
    },
    lastHealthCheck: {
      type: Date,
      default: Date.now,
    },
    responseTime: {
      type: Number, // in milliseconds
      default: 0,
    },
    successRate: {
      type: Number, // percentage
      default: 100,
    },
    totalRequests: {
      type: Number,
      default: 0,
    },
    successfulRequests: {
      type: Number,
      default: 0,
    },
    failedRequests: {
      type: Number,
      default: 0,
    },
    configuration: {
      type: mongoose.Schema.Types.Mixed, // For provider-specific settings
    },
  },
  { timestamps: true }
);

// Ensure only one default provider
providerSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  next();
});

// Index for efficient queries
providerSchema.index({ name: 1 });
providerSchema.index({ isActive: 1 });
providerSchema.index({ isDefault: 1 });
providerSchema.index({ healthStatus: 1 });

const Provider = mongoose.model("Provider", providerSchema);

// Network Provider Schema for individual network providers (MTN, Airtel, etc.)
const networkProviderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ["mtn", "airtel", "glo", "9mobile", "dstv", "gotv", "startimes"],
    },
    displayName: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Reference to the 3rd party provider (VTPass or Clubkonnect)
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },
    // Service type this network provider supports
    serviceType: {
      type: String,
      enum: ["data", "airtime", "cable"],
      required: true,
    },
    // Service ID used by the 3rd party API
    serviceId: {
      type: String,
      required: true,
    },
    // Priority order for display
    priority: {
      type: Number,
      default: 0,
    },
    // Additional configuration
    configuration: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
networkProviderSchema.index({ provider: 1, serviceType: 1 });
networkProviderSchema.index({ isActive: 1 });
networkProviderSchema.index({ serviceType: 1 });
// Compound index to ensure unique network per provider per service type
networkProviderSchema.index({ name: 1, provider: 1, serviceType: 1 }, { unique: true });

const NetworkProvider = mongoose.model("NetworkProvider", networkProviderSchema);

module.exports = { Provider, NetworkProvider };