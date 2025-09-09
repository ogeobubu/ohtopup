const mongoose = require("mongoose");

const tutorialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'getting-started',
        'payments',
        'gaming',
        'account',
        'support'
      ],
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    type: {
      type: String,
      required: true,
      enum: ['video', 'interactive', 'text'],
      default: 'text',
    },
    steps: [{
      type: String,
      trim: true,
    }],
    videoUrl: {
      type: String,
      trim: true,
    },
    popular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
tutorialSchema.index({ category: 1, isActive: 1, order: 1 });

const Tutorial = mongoose.model("Tutorial", tutorialSchema);

module.exports = Tutorial;