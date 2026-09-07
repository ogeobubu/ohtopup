const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  balance: { type: Number, default: 0, min: 0 },
  balanceKobo: { type: Number, min: 0, validate: Number.isSafeInteger },
  transactions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
  ],
  isActive: { type: Boolean, default: true },
});

const Wallet = mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);
module.exports = Wallet;
