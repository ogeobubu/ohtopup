const mongoose = require("mongoose");

const walletSettingsSchema = new mongoose.Schema(
  {
    // Paystack fee settings
    paystackFee: {
      percentage: {
        type: Number,
        default: 1.5,
        min: 0,
        max: 100
      },
      fixedFee: {
        type: Number,
        default: 100,
        min: 0
      },
      cap: {
        type: Number,
        default: 2000,
        min: 0
      }
    },

    // Monnify fee settings
    monnifyFee: {
      percentage: {
        type: Number,
        default: 1.5,
        min: 0,
        max: 100
      },
      fixedFee: {
        type: Number,
        default: 100,
        min: 0
      },
      cap: {
        type: Number,
        default: 2000,
        min: 0
      }
    },

    // General wallet settings
    minDepositAmount: {
      type: Number,
      default: 100,
      min: 0
    },

    maxDepositAmount: {
      type: Number,
      default: 1000000,
      min: 0
    },

    minWithdrawalAmount: {
      type: Number,
      default: 100,
      min: 0
    },

    maxWithdrawalAmount: {
      type: Number,
      default: 500000,
      min: 0
    },

    // Fee deduction settings
    deductFeesFromDeposits: {
      type: Boolean,
      default: true
    },

    deductFeesFromWithdrawals: {
      type: Boolean,
      default: false
    },

    // Withdrawal fee settings
    withdrawalFee: {
      percentage: {
        type: Number,
        default: 1,
        min: 0,
        max: 100
      },
      fixedFee: {
        type: Number,
        default: 50,
        min: 0
      },
      cap: {
        type: Number,
        default: 500,
        min: 0
      },
      deductionMethods: {
        fromWallet: {
          type: Boolean,
          default: true
        },
        fromWithdrawal: {
          type: Boolean,
          default: true
        }
      }
    },

    // Maintenance mode
    maintenanceMode: {
      type: Boolean,
      default: false
    },

    maintenanceMessage: {
      type: String,
      default: "Wallet services are temporarily unavailable for maintenance."
    },

    // Auto approval settings
    autoApproveDeposits: {
      type: Boolean,
      default: true
    },

    autoApproveWithdrawals: {
      type: Boolean,
      default: false
    },

    // Notification settings
    emailNotifications: {
      depositSuccess: {
        type: Boolean,
        default: true
      },
      withdrawalSuccess: {
        type: Boolean,
        default: true
      },
      lowBalance: {
        type: Boolean,
        default: true
      }
    },

    // Low balance threshold
    lowBalanceThreshold: {
      type: Number,
      default: 1000,
      min: 0
    }
  },
  { timestamps: true }
);

// Ensure only one settings document exists
walletSettingsSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existing = await this.constructor.findOne();
    if (existing) {
      throw new Error('Only one wallet settings document can exist');
    }
  }
  next();
});

const WalletSettings = mongoose.model("WalletSettings", walletSettingsSchema);

module.exports = WalletSettings;