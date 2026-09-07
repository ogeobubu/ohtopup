const mongoose = require('mongoose');
const Wallet = require('../model/Wallet');
const Entry = require('../model/WalletEntry');
const { toKobo } = require('../utils/money');

const transact = async (work) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await work(session); }, {
      readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' },
    });
    return result;
  } finally { await session.endSession(); }
};

// Must run in the same transaction as the business record that authorizes the movement.
const move = async ({ walletId, deltaKobo, key, reason, session }) => {
  if (!session || !key || !Number.isSafeInteger(deltaKobo) || deltaKobo === 0) {
    throw new Error('Invalid accounting operation');
  }
  const existing = await Entry.findOne({ key }).session(session);
  if (existing) {
    if (String(existing.walletId) !== String(walletId) || existing.deltaKobo !== deltaKobo) {
      throw Object.assign(new Error('Accounting reference already used'), { status: 409 });
    }
    return Wallet.findById(walletId).session(session);
  }
  const wallet = await Wallet.findById(walletId).session(session);
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { status: 404 });
  const before = wallet.balanceKobo ?? toKobo(wallet.balance, { allowZero: true });
  const after = before + deltaKobo;
  if (!Number.isSafeInteger(after) || after < 0 || (deltaKobo < 0 && !wallet.isActive)) {
    throw Object.assign(new Error('Insufficient funds or wallet disabled'), { status: 400 });
  }
  wallet.balanceKobo = after;
  wallet.balance = after / 100; // Compatibility for existing clients and reports.
  await wallet.save({ session });
  await Entry.create([{ key, walletId, deltaKobo, balanceAfterKobo: after, reason }], { session });
  return wallet;
};
module.exports = { transact, move };
