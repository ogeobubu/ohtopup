const crypto = require('crypto');
const Event = require('../model/PaymentEvent');
const ingest = async (rawBody, signature, secret) => {
  if (!Buffer.isBuffer(rawBody) || !secret || typeof signature !== 'string' || !/^[a-f0-9]{128}$/i.test(signature)) {
    throw Object.assign(new Error('Invalid webhook signature'), { status: 400 });
  }
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest();
  if (!crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'))) {
    throw Object.assign(new Error('Invalid webhook signature'), { status: 400 });
  }
  const payload = JSON.parse(rawBody.toString('utf8'));
  if (typeof payload.event !== 'string' || typeof payload.data?.reference !== 'string') {
    throw Object.assign(new Error('Invalid webhook payload'), { status: 400 });
  }
  const key = crypto.createHash('sha256').update(rawBody).digest('hex');
  try { await Event.updateOne({ key }, { $setOnInsert: { key, payload, status: 'pending', nextAttemptAt: new Date() } }, { upsert: true }); }
  catch (error) { if (error.code !== 11000) throw error; }
};
const processOne = async (handler) => {
  const now = new Date();
  const leaseToken = crypto.randomUUID();
  const event = await Event.findOneAndUpdate({ $or: [
    { status: 'pending', nextAttemptAt: { $lte: now } },
    { status: 'processing', leaseUntil: { $lte: now } },
  ] }, { $set: { status: 'processing', leaseToken, leaseUntil: new Date(Date.now() + 120000) }, $inc: { attempts: 1 } }, { new: true, sort: { createdAt: 1 } });
  if (!event) return false;
  try {
    await handler(event.payload);
    await Event.updateOne({ _id: event._id, leaseToken }, { $set: { status: 'completed' }, $unset: { leaseUntil: 1, leaseToken: 1, lastError: 1 } });
  } catch (error) {
    await Event.updateOne({ _id: event._id, leaseToken }, { $set: {
      status: event.attempts >= 12 ? 'review' : 'pending',
      nextAttemptAt: new Date(Date.now() + Math.min(3600000, 1000 * 2 ** event.attempts)),
      lastError: String(error.message).slice(0, 300),
    }, $unset: { leaseUntil: 1, leaseToken: 1 } });
    console.error('Payment event requires retry', event.key);
  }
  return true;
};
module.exports = { ingest, processOne };
