const Transaction = require('../model/Transaction');
const Wallet = require('../model/Wallet');
const accounting = require('./accountingService');
const { toKobo } = require('../utils/money');
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };

const ownedDeposit = async (reference, userId) => {
  if (typeof reference !== 'string' || !reference || reference.length > 200) fail('Invalid payment reference');
  const transaction = await Transaction.findOne({ reference, type: 'deposit' });
  if (!transaction) fail('Payment reference not found', 404);
  const wallet = await Wallet.findById(transaction.walletId);
  if (!wallet || (userId && String(wallet.userId) !== String(userId))) fail('Payment reference not found', 404);
  return transaction;
};

const settle = async ({ reference, amountKobo, currency, provider, userId, gatewayResponse }) => {
  if (currency !== 'NGN' || !Number.isSafeInteger(amountKobo) || amountKobo <= 0) fail('Invalid verified payment amount or currency');
  return accounting.transact(async session => {
    const tx = await Transaction.findOne({ reference, type: 'deposit' }).session(session);
    if (!tx || tx.paymentMethod !== provider) fail('Payment reference not found', 404);
    const wallet = await Wallet.findById(tx.walletId).session(session);
    if (!wallet || (userId && String(wallet.userId) !== String(userId))) fail('Payment reference not found', 404);
    const expected = tx.amountKobo ?? toKobo(tx.originalAmount ?? tx.amount);
    if (amountKobo !== expected) fail('Verified payment amount does not match the deposit');
    if (tx.status === 'completed') return { wallet, transaction: tx, duplicate: true };
    if (!['pending', 'failed'].includes(tx.status)) fail('Deposit cannot be completed', 409);
    // New deposits store the quoted net credit before checkout. Legacy records require review.
    if (!Number.isSafeInteger(tx.creditKobo) || tx.creditKobo <= 0 || tx.creditKobo > expected) {
      fail('Deposit requires reconciliation: missing credit quote', 409);
    }
    const updated = await accounting.move({ walletId: wallet._id, deltaKobo: tx.creditKobo,
      key: `deposit:${reference}`, reason: `${provider} deposit`, session });
    tx.amount = tx.creditKobo / 100;
    tx.status = 'completed';
    tx.completedAt = new Date();
    tx.gatewayResponse = gatewayResponse;
    await tx.save({ session });
    return { wallet: updated, transaction: tx, duplicate: false };
  });
};
module.exports = { ownedDeposit, settle };
