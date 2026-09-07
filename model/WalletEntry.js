const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true, index: true },
  deltaKobo: { type: Number, required: true },
  balanceAfterKobo: { type: Number, required: true },
  reason: { type: String, required: true },
}, { timestamps: true });
module.exports = mongoose.model('WalletEntry', schema);
