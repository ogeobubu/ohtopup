const Utility = require('../model/Utility');
const Wallet = require('../model/Wallet');
const accounting = require('./accountingService');
const { toKobo } = require('../utils/money');
const crypto = require('crypto');
const { generateRequestId } = require('../utils');

const begin = async ({ userId, key, fingerprint, amount, cost, serviceID, contact, type, provider, providerId, details = {} }) => {
  const debitKobo = toKobo(cost);
  const operationKey = `${userId}:${key}`;
  return accounting.transact(async session => {
    const existing = await Utility.findOne({ operationKey }).session(session);
    if (existing) {
      if (existing.fingerprint !== fingerprint) throw Object.assign(new Error('Purchase key already used with different details'), { status: 409 });
      return { transaction: existing, duplicate: true };
    }
    const pending = await Utility.findOne({ user: userId, fingerprint, status: { $in: ['pending', 'review_needed'] } }).session(session);
    if (pending) return { transaction: pending, duplicate: true };
    const wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) throw Object.assign(new Error('Wallet not found'), { status: 404 });
    const requestId = generateRequestId();
    await accounting.move({ walletId: wallet._id, deltaKobo: -debitKobo, key: `purchase:${requestId}`, reason: `${type} purchase`, session });
    const [transaction] = await Utility.create([{ ...details, operationKey, fingerprint, walletId: wallet._id,
      debitKobo, requestId, user: userId, amount, adjustedAmount: cost, serviceID, phone: contact,
      type, transactionType: type, product_name: `${type} purchase`, revenue: amount, commissionRate: 0,
      status: 'pending', provider, providerId, nextCheckAt: new Date(Date.now() + 120000),
    }], { session });
    return { transaction, duplicate: false };
  });
};
const normalize = (provider, response) => {
  const raw = response?.rawResponse || response?.data || response || {};
  const status = String(raw.content?.transactions?.status || raw.status || response?.status || '').toUpperCase();
  let result = 'pending';
  if (provider === 'vtpass') {
    if (status === 'DELIVERED' && String(raw.code) === '000') result = 'delivered';
    if (status === 'FAILED') result = 'failed';
  } else {
    if (['ORDER_COMPLETED', 'SUCCESS'].includes(status)) result = 'delivered';
    if (['ORDER_FAILED', 'ORDER_CANCELLED', 'FAILED', 'INVALID_MOBILENETWORK', 'INVALID_DATAPLAN', 'INSUFFICIENT_BALANCE'].includes(status)) result = 'failed';
  }
  return { status: result, raw };
};
const finish = async (requestId, response) => accounting.transact(async session => {
  const tx = await Utility.findOne({ requestId }).session(session);
  if (!tx || !tx.debitKobo) throw new Error('Purchase reservation missing');
  if (['delivered', 'failed'].includes(tx.status)) return tx;
  const outcome = normalize(tx.provider, response);
  const raw = outcome.raw;
  const token = raw.purchased_code || raw.token || raw.content?.transactions?.purchased_code;
  tx.status = outcome.status;
  if (tx.type === 'electricity' && tx.variation_code === 'prepaid' && tx.status === 'delivered' && !token) tx.status = 'review_needed';
  if (token) tx.token = String(token);
  if (raw.units || raw.content?.transactions?.units) tx.units = String(raw.units || raw.content.transactions.units);
  tx.providerResponse = raw;
  tx.nextCheckAt = new Date(Date.now() + 120000);
  if (tx.status === 'failed') {
    await accounting.move({ walletId: tx.walletId, deltaKobo: tx.debitKobo, key: `purchase-refund:${requestId}`, reason: 'Confirmed purchase failure', session });
  }
  await tx.save({ session });
  return tx;
});
const fingerprint = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
module.exports = { begin, finish, normalize, fingerprint };
