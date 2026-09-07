const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../model/User');
const valid = pin => typeof pin === 'string' && /^\d{4,6}$/.test(pin);
const matches = async (user, pin) => {
  if (!valid(pin)) return false;
  if (user.transactionPinHash) return bcrypt.compare(pin, user.transactionPinHash);
  const legacy = user.transactionPin;
  return typeof legacy === 'string' && legacy.length === pin.length &&
    crypto.timingSafeEqual(Buffer.from(legacy), Buffer.from(pin));
};
const verify = async (userId, pin) => {
  const user = await User.findById(userId).select('+transactionPin +transactionPinHash');
  if (!user || !await matches(user, pin)) return false;
  if (!user.transactionPinHash) {
    const hash = await bcrypt.hash(pin, 12);
    const migrated = await User.updateOne({ _id: userId, transactionPin: user.transactionPin, transactionPinHash: null },
      { $set: { transactionPinHash: hash }, $unset: { transactionPin: 1 } });
    if (!migrated.modifiedCount) {
      const current = await User.findById(userId).select('+transactionPinHash');
      return Boolean(current && await matches(current, pin));
    }
  }
  return true;
};
module.exports = { valid, matches, verify };
