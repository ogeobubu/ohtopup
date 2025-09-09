const mongoose = require("mongoose");

const diceGameSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    entryFee: {
      type: Number,
      required: true,
      default: 10, // 10 Naira entry fee
    },
    dice1: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    dice2: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    isWin: {
      type: Boolean,
      required: true,
    },
    winnings: {
      type: Number,
      default: 0, // 1000 Naira if win, 0 if lose
    },
    status: {
      type: String,
      enum: ["played", "completed"],
      default: "completed",
    },
    gameResult: {
      type: String,
      enum: ["win", "lose"],
      required: true,
    },
    playedAt: {
      type: Date,
      default: Date.now,
    },
    adminEmailSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
diceGameSchema.index({ user: 1, playedAt: -1 });
diceGameSchema.index({ playedAt: -1 });
diceGameSchema.index({ gameResult: 1 });

// Dice Game Settings Schema
const diceGameSettingsSchema = new mongoose.Schema(
  {
    gameEnabled: {
      type: Boolean,
      default: true,
    },
    entryFee: {
      type: Number,
      default: 10,
      min: 1,
      max: 1000,
    },
    winAmount: {
      type: Number,
      default: 1000,
      min: 100,
      max: 10000,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    minBalanceRequired: {
      type: Number,
      default: 10,
      min: 1,
      max: 1000,
    },
    maxDailyGames: {
      type: Number,
      default: 100,
      min: 1,
      max: 1000,
    },
    houseEdge: {
      type: Number,
      default: 97.22,
      min: 0,
      max: 100,
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
      autoShutdown: {
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
        default: 0.0278, // 1/36 natural probability
        min: 0,
        max: 1,
      },
      targetDice1: {
        type: Number,
        default: 6,
        min: 1,
        max: 6,
      },
      targetDice2: {
        type: Number,
        default: 6,
        min: 1,
        max: 6,
      },
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

const DiceGame = mongoose.model("DiceGame", diceGameSchema);
const DiceGameSettings = mongoose.model("DiceGameSettings", diceGameSettingsSchema);

module.exports = { DiceGame, DiceGameSettings };