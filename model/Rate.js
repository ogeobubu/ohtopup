const mongoose = require("mongoose");

const rateSchema = new mongoose.Schema({
  withdrawalRate: {
    type: Number,
    required: true,
  },
  depositRate: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Rate", rateSchema);