const mongoose = require('mongoose');
const PaymentEvent = require('../model/PaymentEvent');
const Utility = require('../model/Utility');

const STALE_PURCHASE_MS = 15 * 60 * 1000;

const getOverview = async ({ limit = 20 } = {}) => {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_PURCHASE_MS);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const stalePurchaseQuery = {
    status: { $in: ['initiated', 'pending'] },
    updatedAt: { $lte: staleBefore },
  };

  const [
    eventCounts,
    overdueEvents,
    expiredLeases,
    stalePurchases,
    reviewPurchases,
    reviewEvents,
    purchaseQueue,
  ] = await Promise.all([
    PaymentEvent.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    PaymentEvent.countDocuments({ status: 'pending', nextAttemptAt: { $lte: now } }),
    PaymentEvent.countDocuments({ status: 'processing', leaseUntil: { $lte: now } }),
    Utility.countDocuments(stalePurchaseQuery),
    Utility.countDocuments({ status: 'review_needed' }),
    PaymentEvent.find({ status: 'review' }).select('key status attempts nextAttemptAt lastError createdAt updatedAt').sort({ updatedAt: -1 }).limit(safeLimit).lean(),
    Utility.find({ $or: [stalePurchaseQuery, { status: 'review_needed' }] })
      .select('requestId type serviceID provider status localStatus localErrorMessage amount user createdAt updatedAt nextCheckAt reconciliationAttempts')
      .sort({ updatedAt: 1 }).limit(safeLimit).lean(),
  ]);

  const byStatus = Object.fromEntries(eventCounts.map(item => [item._id, item.count]));
  return {
    generatedAt: now,
    thresholds: { stalePurchaseMinutes: STALE_PURCHASE_MS / 60000 },
    summary: {
      reviewEvents: byStatus.review || 0,
      pendingEvents: byStatus.pending || 0,
      processingEvents: byStatus.processing || 0,
      overdueEvents,
      expiredLeases,
      stalePurchases,
      reviewPurchases,
    },
    reviewEvents,
    purchaseQueue,
  };
};

const requeueEvent = async eventId => {
  if (!mongoose.isValidObjectId(eventId)) throw Object.assign(new Error('Payment event not found'), { status: 404 });
  const event = await PaymentEvent.findById(eventId).select('status key attempts nextAttemptAt');
  if (!event) throw Object.assign(new Error('Payment event not found'), { status: 404 });
  if (event.status === 'pending') return { event, duplicate: true };
  if (event.status !== 'review') throw Object.assign(new Error('Only events awaiting review can be requeued'), { status: 409 });

  const updated = await PaymentEvent.findOneAndUpdate(
    { _id: eventId, status: 'review' },
    { $set: { status: 'pending', nextAttemptAt: new Date() }, $unset: { leaseUntil: 1, leaseToken: 1 } },
    { new: true }
  ).select('status key attempts nextAttemptAt');
  if (updated) return { event: updated, duplicate: false };

  const current = await PaymentEvent.findById(eventId).select('status key attempts nextAttemptAt');
  if (current?.status === 'pending') return { event: current, duplicate: true };
  throw Object.assign(new Error('Payment event state changed; refresh and try again'), { status: 409 });
};

module.exports = { getOverview, requeueEvent, STALE_PURCHASE_MS };
