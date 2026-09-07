// Read-only deployment check. Does not modify balances, indexes, or payment records.
require('dotenv').config();
const mongoose = require('mongoose');
async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false });
  const db = mongoose.connection.db;
  const topology = await db.admin().command({ hello: 1 });
  const duplicateWallets = await db.collection('wallets').aggregate([
    { $group: { _id: '$userId', count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }, { $count: 'count' },
  ]).toArray();
  const invalidBalances = await db.collection('wallets').countDocuments({ $or: [
    { balance: { $lt: 0 } }, { balance: { $not: { $type: 'number' } } },
    { $expr: { $and: [ { $ne: [{ $type: '$balanceKobo' }, 'missing'] },
      { $ne: ['$balance', { $divide: ['$balanceKobo', 100] }] } ] } },
  ] });
  const legacyPendingDeposits = await db.collection('transactions').countDocuments({ type: 'deposit', status: 'pending', creditKobo: { $exists: false } });
  const legacyOpenWithdrawals = await db.collection('transactions').countDocuments({ type: 'withdrawal', status: { $in: ['pending', 'approved', 'processing'] }, amountKobo: { $exists: false } });
  const eventsForReview = await db.collection('paymentevents').countDocuments({ status: 'review' });
  const stalePurchases = await db.collection('utilities').countDocuments({ status: { $in: ['pending', 'review_needed'] }, createdAt: { $lt: new Date(Date.now() - 900000) } });
  const staleDeposits = await db.collection('transactions').countDocuments({ type: 'deposit', status: 'pending', createdAt: { $lt: new Date(Date.now() - 900000) } });
  const result = { transactionCapable: Boolean(topology.setName || topology.msg === 'isdbgrid'),
    duplicateWalletOwners: duplicateWallets[0]?.count || 0, invalidBalances, legacyPendingDeposits, legacyOpenWithdrawals, eventsForReview, stalePurchases, staleDeposits };
  console.log(JSON.stringify(result, null, 2));
  if (!result.transactionCapable || Object.entries(result).some(([k, v]) => k !== 'transactionCapable' && v > 0)) process.exitCode = 1;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
