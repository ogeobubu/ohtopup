const session = require('express-session');
const mongoose = require('mongoose');
const schema = new mongoose.Schema({ _id: String, value: mongoose.Schema.Types.Mixed, expires: Date });
schema.index({ expires: 1 }, { expireAfterSeconds: 0 });
const Session = mongoose.model('Session', schema);
module.exports = class MongoSessionStore extends session.Store {
  get(id, callback) {
    Session.findOne({ _id: id, expires: { $gt: new Date() } }).lean()
      .then(row => callback(null, row?.value || null), callback);
  }
  set(id, value, callback = () => {}) {
    const expires = value.cookie?.expires ? new Date(value.cookie.expires) : new Date(Date.now() + 86400000);
    Session.updateOne({ _id: id }, { $set: { value, expires } }, { upsert: true }).then(() => callback(), callback);
  }
  destroy(id, callback = () => {}) { Session.deleteOne({ _id: id }).then(() => callback(), callback); }
  touch(id, value, callback = () => {}) { this.set(id, value, callback); }
};
