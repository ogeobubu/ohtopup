const mongoose = require("mongoose");

const betDiceGameSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    betAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    odds: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "expert", "legendary"],
      required: true,
    },
    diceCount: {
      type: Number,
      required: true,
      min: 2,
      max: 6,
      default: 2,
    },
    dice: [{
      type: Number,
      required: true,
      min: 1,
      max: 6,
    }],
    targetCombination: {
      type: String,
      required: true,
      enum: [
        "any_double",
        "double_4_plus",
        "double_5_plus",
        "double_6",
        "three_of_kind"
      ],
    },
    isWin: {
      type: Boolean,
      required: true,
    },
    winnings: {
      type: Number,
      default: 0,
    },
    payout: {
      type: Number,
      default: 0, // betAmount * odds if win
    },
    gameResult: {
      type: String,
      enum: ["win", "lose"],
      required: true,
    },
    expectedValue: {
      type: Number,
      default: 0,
    },
    houseEdge: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["played", "completed"],
      default: "completed",
    },
    playedAt: {
      type: Date,
      default: Date.now,
    },
    adminEmailSent: {
      type: Boolean,
      default: false,
    },
    manipulationApplied: {
      type: Boolean,
      default: false,
    },
    manipulationType: {
      type: String,
      enum: ['fair', 'biased_win', 'biased_loss', 'fixed_win', 'fixed_loss', 'custom_probability', 'specific_dice'],
      default: 'fair',
    },
  },
  { timestamps: true }
);

// Index for efficient queries
betDiceGameSchema.index({ user: 1, playedAt: -1 });
betDiceGameSchema.index({ playedAt: -1 });
betDiceGameSchema.index({ gameResult: 1 });
betDiceGameSchema.index({ difficulty: 1 });
betDiceGameSchema.index({ isWin: 1 });

// Bet Dice Game Settings Schema
const betDiceGameSettingsSchema = new mongoose.Schema(
  {
    gameEnabled: {
      type: Boolean,
      default: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    minBetAmount: {
      type: Number,
      default: 10,
      min: 1,
      max: 1000,
    },
    maxBetAmount: {
      type: Number,
      default: 1000,
      min: 100,
      max: 10000,
    },
    entryFee: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    maxDiceCount: {
      type: Number,
      default: 6,
      min: 2,
      max: 6,
    },
    difficultyLevels: {
      easy: {
        enabled: { type: Boolean, default: true },
        oddsRange: {
          min: { type: Number, default: 1.2 },
          max: { type: Number, default: 1.8 }
        },
        probability: { type: Number, default: 16.67 }
      },
      medium: {
        enabled: { type: Boolean, default: true },
        oddsRange: {
          min: { type: Number, default: 2.0 },
          max: { type: Number, default: 3.5 }
        },
        probability: { type: Number, default: 8.33 }
      },
      hard: {
        enabled: { type: Boolean, default: true },
        oddsRange: {
          min: { type: Number, default: 3.0 },
          max: { type: Number, default: 6.0 }
        },
        probability: { type: Number, default: 5.56 }
      },
      expert: {
        enabled: { type: Boolean, default: true },
        oddsRange: {
          min: { type: Number, default: 5.0 },
          max: { type: Number, default: 12.0 }
        },
        probability: { type: Number, default: 2.78 }
      },
      legendary: {
        enabled: { type: Boolean, default: true },
        oddsRange: {
          min: { type: Number, default: 8.0 },
          max: { type: Number, default: 20.0 }
        },
        probability: { type: Number, default: 4.63 }
      }
    },
    notifications: {
      emailEnabled: {
        type: Boolean,
        default: true,
      },
      largeWinAlert: {
        type: Boolean,
        default: true,
      },
      suspiciousActivity: {
        type: Boolean,
        default: true,
      },
      betLimitExceeded: {
        type: Boolean,
        default: true,
      },
    },
    riskManagement: {
      maxLossPerHour: {
        type: Number,
        default: 50000,
        min: 1000,
        max: 1000000,
      },
      maxWinPerHour: {
        type: Number,
        default: 100000,
        min: 1000,
        max: 1000000,
      },
      maxDailyBetsPerUser: {
        type: Number,
        default: 100,
        min: 1,
        max: 1000,
      },
      autoShutdown: {
        type: Boolean,
        default: true,
      },
    },
    houseEdge: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 20,
    },
    analytics: {
      trackBettingPatterns: {
        type: Boolean,
        default: true,
      },
      generateReports: {
        type: Boolean,
        default: true,
      },
      alertOnAnomalies: {
        type: Boolean,
        default: true,
      },
    },
    manipulation: {
      enabled: {
        type: Boolean,
        default: false,
      },
      mode: {
        type: String,
        enum: ['fair', 'biased_win', 'biased_loss', 'fixed_win', 'fixed_loss', 'custom_probability', 'specific_dice'],
        default: 'fair',
      },
      bias: {
        type: Number,
        default: 0.5,
        min: 0,
        max: 1,
      },
      winProbability: {
        type: Number,
        default: 0.0278,
        min: 0,
        max: 1,
      },
      targetDice: [{
        type: Number,
        default: [6, 6],
        min: 1,
        max: 6,
      }],
      seed: {
        type: String,
        default: null,
      },
      adminOnly: {
        type: Boolean,
        default: true,
      },
      logManipulations: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true }
);

const BetDiceGame = mongoose.model("BetDiceGame", betDiceGameSchema);
const BetDiceGameSettings = mongoose.model("BetDiceGameSettings", betDiceGameSettingsSchema);

module.exports = { BetDiceGame, BetDiceGameSettings };