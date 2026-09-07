const Transaction = require('../model/Transaction');
const Utility = require('../model/Utility');
const { Provider } = require('../model/Provider');
const events = require('./paymentEventService');
const deposits = require('../controllers/depositController');
const purchases = require('./purchaseService');

const reconcilePurchases = async () => {
  const rows = await Utility.find({ debitKobo: { $gt: 0 }, status: { $in: ['pending', 'review_needed'] }, nextCheckAt: { $lte: new Date() } }).sort({ nextCheckAt: 1 }).limit(10);
  for (const tx of rows) {
    // Lease the next check across worker instances. Requery never initiates another purchase.
    const claimed = await Utility.updateOne({ _id: tx._id, nextCheckAt: tx.nextCheckAt }, {
      $set: { nextCheckAt: new Date(Date.now() + 300000) }, $inc: { reconciliationAttempts: 1 },
    });
    if (!claimed.modifiedCount) continue;
    try {
      const provider = await Provider.findById(tx.providerId);
      if (!provider) throw new Error('Provider missing');
      const adapter = require('../controllers/purchaseController').makeAdapter(provider);
      const result = provider.name === 'vtpass'
        ? await adapter.requeryTransaction(tx.requestId) : await adapter.queryTransaction(null, tx.requestId);
      await purchases.finish(tx.requestId, result);
    } catch { console.error('Purchase reconciliation deferred', tx.requestId); }
  }
};
const reconcileDeposits = async () => {
  const rows = await Transaction.find({ type: 'deposit', paymentMethod: { $in: ['paystack', 'monnify'] },
    status: 'pending', creditKobo: { $gt: 0 }, nextCheckAt: { $lte: new Date() } }).sort({ nextCheckAt: 1 }).limit(10);
  for (const tx of rows) {
    const claimed = await Transaction.updateOne({ _id: tx._id, nextCheckAt: tx.nextCheckAt }, { $set: { nextCheckAt: new Date(Date.now() + 600000) } });
    if (!claimed.modifiedCount) continue;
    try {
      if (tx.paymentMethod === 'paystack') await deposits.verifyReference(tx.reference);
      else await deposits.verifyMonnifyReference(tx.reference);
    } catch { console.error('Deposit reconciliation deferred', tx.reference); }
  }
};
const tick = async () => {
  const { processWebhookEvent } = require('../controllers/walletController');
  for (let n = 0; n < 10 && await events.processOne(processWebhookEvent); n++) { /* bounded batch */ }
  await reconcileDeposits();
  await reconcilePurchases();
};
const start = () => {
  let stopped = false;
  let timer;
  const run = async () => {
    try { await tick(); } catch (error) { console.error('Payment worker failed', error.message); }
    if (!stopped) { timer = setTimeout(run, 5000); timer.unref(); }
  };
  run();
  return () => { stopped = true; clearTimeout(timer); };
};
module.exports = { start, tick, reconcilePurchases, reconcileDeposits };
