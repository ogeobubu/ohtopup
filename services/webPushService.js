const WebPushSubscription = require("../model/WebPushSubscription");
const { getFirebaseMessaging } = require("../config/firebase");

const subscribe = async (userId, subscription, userAgent) => {
  const { endpoint, keys } = subscription;

  const existing = await WebPushSubscription.findOne({ userId, endpoint });
  if (existing) {
    existing.keys = keys;
    existing.userAgent = userAgent || existing.userAgent;
    existing.updatedAt = new Date();
    await existing.save();
    return existing;
  }

  return WebPushSubscription.create({
    userId,
    endpoint,
    keys,
    userAgent,
  });
};

const unsubscribe = async (userId, endpoint) => {
  return WebPushSubscription.findOneAndDelete({ userId, endpoint });
};

const sendWebPush = async (userId, title, body, data = {}) => {
  const messaging = getFirebaseMessaging();
  if (!messaging) return [];

  const subscriptions = await WebPushSubscription.find({ userId });
  if (subscriptions.length === 0) return [];

  const payload = { title, body, link: data.link || "/" };
  const results = [];

  for (const sub of subscriptions) {
    try {
      await messaging.send({
        token: sub.endpoint,
        data: payload,
      });
      results.push({ endpoint: sub.endpoint, sent: true });
    } catch (error) {
      if (
        error.code === "messaging/registration-token-not-registered" ||
        error.code === "messaging/invalid-registration-token"
      ) {
        await WebPushSubscription.findByIdAndDelete(sub._id);
      }
      results.push({ endpoint: sub.endpoint, sent: false, error: error.message });
    }
  }

  return results;
};

const getUserSubscriptions = async (userId) => {
  return WebPushSubscription.find({ userId }).select("endpoint createdAt");
};

module.exports = {
  subscribe,
  unsubscribe,
  sendWebPush,
  getUserSubscriptions,
};
