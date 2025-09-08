const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
      enum: ["reward", "ranking", "system"],
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
settingsSchema.index({ type: 1 });

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = Settings;