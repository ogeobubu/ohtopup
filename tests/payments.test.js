require('dotenv').config = () => ({ parsed: {} });
process.env.JWT_SECRET = 'isolated-test-secret';
process.env.NODE_ENV = 'test';
require('node-cron').schedule = () => ({ stop() {} });
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const Wallet = require('../model/Wallet');
const Transaction = require('../model/Transaction');
const Entry = require('../model/WalletEntry');
const Utility = require('../model/Utility');
const Event = require('../model/PaymentEvent');
const Audit = require('../model/WithdrawalAuditLog');
const accounting = require('../services/accountingService');
const deposits = require('../services/depositService');
const purchases = require('../services/purchaseService');
const events = require('../services/paymentEventService');
const withdrawals = require('../services/withdrawalService');
const { toKobo } = require('../utils/money');
let mongo;
let server;
let baseUrl;
before(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { downloadDir: '/tmp/ohtopup-mongodb' } });
  await mongoose.connect(mongo.getUri());
  await Promise.all([Wallet, Transaction, Entry, Utility, Event, Audit].map(m => m.init()));
  const app = require('express')();
  app.use(require('express').json());
  app.use('/wallet', require('../routes/walletRoutes'));
  app.use('/users', require('../routes/userRoutes'));
  app.use('/admin', require('../routes/adminRoutes'));
  app.use(require('../middleware/errorHandler').handleServiceError);
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); await mongoose.disconnect(); if (mongo) await mongo.stop(); });
beforeEach(async () => { await Promise.all([Wallet, Transaction, Entry, Utility, Event, Audit].map(m => m.deleteMany({}))); });
const fixture = async () => {
  const userId = new mongoose.Types.ObjectId();
  const wallet = await Wallet.create({ userId, balance: 1000 });
  return { userId, wallet };
};
test('money rejects invalid, fractional kobo and unsafe amounts', () => {
  for (const value of [-1, 0, Infinity, NaN, '5bad', '', {}, true, 1.001, 1e20]) assert.throws(() => toKobo(value));
  assert.equal(toKobo('10.25'), 1025);
});
test('concurrent debits cannot overspend and every committed balance has an entry', async () => {
  const { wallet } = await fixture();
  const results = await Promise.allSettled(Array.from({ length: 8 }, (_, n) => accounting.transact(session =>
    accounting.move({ walletId: wallet._id, deltaKobo: -30000, key: `buy-${n}`, reason: 'test', session }))));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 3);
  assert.equal((await Wallet.findById(wallet._id)).balanceKobo, 10000);
  assert.equal(await Entry.countDocuments(), 3);
});
test('failed business write rolls back balance and ledger together', async () => {
  const { wallet } = await fixture();
  await assert.rejects(accounting.transact(async session => {
    await accounting.move({ walletId: wallet._id, deltaKobo: -5000, key: 'rollback', reason: 'test', session });
    throw new Error('simulated crash before business record');
  }));
  assert.equal((await Wallet.findById(wallet._id)).balance, 1000);
  assert.equal(await Entry.countDocuments(), 0);
});
const depositFixture = async () => {
  const { userId, wallet } = await fixture();
  await Transaction.create({ walletId: wallet._id, reference: 'payment-1', amount: 500,
    amountKobo: 50000, creditKobo: 49000, originalAmount: 500, type: 'deposit', paymentMethod: 'paystack' });
  return { userId, wallet, args: { reference: 'payment-1', amountKobo: 50000, currency: 'NGN', provider: 'paystack', userId } };
};
test('simultaneous callback and duplicate webhook credit a deposit once', async () => {
  const { wallet, args } = await depositFixture();
  await Promise.all(Array.from({ length: 5 }, () => deposits.settle(args)));
  assert.equal((await Wallet.findById(wallet._id)).balance, 1490);
  assert.equal(await Entry.countDocuments(), 1);
  assert.equal((await Transaction.findOne()).status, 'completed');
});
test('wrong owner, amount, currency, provider and unknown payment cannot credit a wallet', async () => {
  const { wallet, args } = await depositFixture();
  for (const patch of [{ userId: new mongoose.Types.ObjectId() }, { amountKobo: 60000 }, { currency: 'USD' }, { provider: 'monnify' }, { reference: 'unknown' }]) {
    await assert.rejects(deposits.settle({ ...args, ...patch }));
  }
  assert.equal((await Wallet.findById(wallet._id)).balance, 1000);
  assert.equal(await Entry.countDocuments(), 0);
});
test('purchase is reserved before delivery; repeated requests and failed outcomes refund once', async () => {
  const { userId, wallet } = await fixture();
  const args = { userId, key: 'purchase-one', fingerprint: 'same', amount: 500, cost: 500,
    serviceID: 'mtn', contact: '08012345678', type: 'airtime', provider: 'vtpass' };
  const first = await purchases.begin(args);
  const duplicate = await purchases.begin(args);
  assert.equal(duplicate.duplicate, true);
  assert.equal((await Wallet.findById(wallet._id)).balance, 500);
  await purchases.finish(first.transaction.requestId, {});
  assert.equal((await Wallet.findById(wallet._id)).balance, 500, 'unknown outcome retains reservation');
  const failed = { code: '016', content: { transactions: { status: 'failed' } } };
  await Promise.all([purchases.finish(first.transaction.requestId, failed), purchases.finish(first.transaction.requestId, failed)]);
  assert.equal((await Wallet.findById(wallet._id)).balance, 1000);
  assert.equal(await Entry.countDocuments(), 2);
  await assert.rejects(purchases.begin({ ...args, fingerprint: 'tampered' }));
});
test('prepaid electricity without a provider token is held for review, never fabricated', async () => {
  const { userId } = await fixture();
  const { transaction } = await purchases.begin({ userId, key: 'electric-one', fingerprint: 'electric', amount: 500, cost: 500,
    serviceID: 'ikeja-electric', contact: '123456', type: 'electricity', provider: 'vtpass', details: { variation_code: 'prepaid' } });
  const result = await purchases.finish(transaction.requestId, { code: '000', content: { transactions: { status: 'delivered' } } });
  assert.equal(result.status, 'review_needed');
  assert.equal(result.token, undefined);
});
test('webhooks authenticate original bytes, persist once and survive a processing failure', async () => {
  const raw = Buffer.from('{ "event":"charge.success", "data":{"reference":"payment-1"} }');
  const secret = 'test-secret';
  const signature = crypto.createHmac('sha512', secret).update(raw).digest('hex');
  await assert.rejects(events.ingest(Buffer.from('{}'), signature, secret));
  await events.ingest(raw, signature, secret);
  await events.ingest(raw, signature, secret);
  assert.equal(await Event.countDocuments(), 1);
  await events.processOne(async () => { throw new Error('temporary outage'); });
  assert.equal((await Event.findOne()).status, 'pending');
  await Event.updateOne({}, { $set: { nextAttemptAt: new Date(0) } });
  await events.processOne(async () => {});
  assert.equal((await Event.findOne()).status, 'completed');
});
test('rejecting a pending withdrawal refunds the complete debit including fees exactly once', async () => {
  const { userId, wallet } = await fixture();
  const tx = await accounting.transact(async session => {
    await accounting.move({ walletId: wallet._id, deltaKobo: -55000, key: 'withdrawal:withdraw-one', reason: 'withdrawal', session });
    const [tx] = await Transaction.create([{ walletId: wallet._id, reference: 'withdraw-one', amount: 500, totalDebited: 550,
      type: 'withdrawal', paymentMethod: 'naira_wallet' }], { session });
    return tx;
  });
  const args = { id: tx._id, status: 'rejected', allowed: ['pending'], refund: true, adminId: userId, reason: 'Customer cancelled' };
  await Promise.all([withdrawals.transition(args), withdrawals.transition(args)]);
  assert.equal((await Wallet.findById(wallet._id)).balance, 1000);
  assert.equal(await Entry.countDocuments(), 2);
  assert.equal(await Audit.countDocuments(), 1);
});

const authenticatedUser = async role => {
  const userId = new mongoose.Types.ObjectId();
  await require('../model/User').collection.insertOne({ _id: userId, username: String(userId), role, isDeleted: false, email: `${userId}@example.com` });
  const token = require('jsonwebtoken').sign({ user: { id: String(userId), role } }, process.env.JWT_SECRET);
  return { userId, token };
};
const call = (path, token, method = 'GET', body) => fetch(baseUrl + path, {
  method, headers: { ...(token && { Authorization: `Bearer ${token}` }), 'Content-Type': 'application/json' },
  ...(body && { body: JSON.stringify(body) }),
});
test('ordinary users cannot list wallets, change settings or use admin aliases', async () => {
  const { token } = await authenticatedUser('user');
  for (const [path, method] of [['/wallet/all', 'GET'], ['/wallet/settings', 'PUT'], ['/wallet/transactions/all', 'GET'],
    ['/users/admin/rewards', 'GET'], ['/users/electricity/settings', 'PUT'], ['/admin/users/analytics', 'GET'], ['/admin/newsletter/send', 'POST']]) {
    assert.equal((await call(path, token, method, method !== 'GET' ? {} : undefined)).status, 403, path);
  }
});
test('forged token roles and deleted accounts do not retain access', async () => {
  const { userId, token } = await authenticatedUser('admin');
  await require('../model/User').updateOne({ _id: userId }, { $set: { role: 'user' } });
  assert.equal((await call('/wallet/all', token)).status, 403);
  await require('../model/User').updateOne({ _id: userId }, { $set: { isDeleted: true } });
  assert.equal((await call('/wallet', token)).status, 401);
});
test('unverified manual deposits are closed and confirmation requires an existing verified payment', async () => {
  const { userId, token } = await authenticatedUser('user');
  const wallet = await Wallet.create({ userId, balance: 0 });
  assert.equal((await call('/wallet/deposit', token, 'POST', { userId, amount: 5000 })).status, 410);
  assert.equal((await call('/wallet/deposit/paystack/confirm', token, 'POST', { reference: 'fake', amount: 5000 })).status, 404);
  assert.equal((await call('/users/deposit', token, 'POST', { reference: 'fake', amount: 5000 })).status, 404);
  assert.equal((await Wallet.findById(wallet._id)).balance, 0);
  assert.equal((await call('/wallet/deposit/paystack/test-webhook', null, 'POST', {})).status, 404);
});
test('a customer cannot initiate a deposit for another customer', async () => {
  const { token } = await authenticatedUser('user');
  const response = await call('/wallet/deposit/paystack/initiate', token, 'POST', { userId: String(new mongoose.Types.ObjectId()), amount: 500 });
  assert.equal(response.status, 403);
});

test('simultaneous identical purchases reserve only once, even with different retry keys', async () => {
  const { userId, wallet } = await fixture();
  const args = { userId, key: 'retry-one', fingerprint: 'same-request', amount: 500, cost: 500,
    serviceID: 'mtn', contact: '08012345678', type: 'airtime', provider: 'vtpass' };
  const results = await Promise.all([purchases.begin(args), purchases.begin({ ...args, key: 'retry-two' })]);
  assert.equal(results.filter(r => !r.duplicate).length, 1);
  assert.equal((await Wallet.findById(wallet._id)).balance, 500);
  assert.equal(await Utility.countDocuments(), 1);
});

test('checkout stores a quote before gateway initialization and cannot be credited twice through HTTP', async t => {
  const { userId, token } = await authenticatedUser('user');
  await Wallet.create({ userId, balance: 0 });
  let reference;
  const axios = require('axios');
  t.mock.method(axios, 'post', async (url, payload) => {
    assert.equal(url, 'https://api.paystack.co/transaction/initialize');
    reference = payload.reference;
    const tx = await Transaction.findOne({ reference });
    assert.equal(tx.amountKobo, 50000);
    assert.equal(payload.email, `${userId}@example.com`);
    return { data: { status: true, data: { reference, authorization_url: 'https://checkout.paystack.com/test-only' } } };
  });
  const initialized = await call('/wallet/deposit/paystack/initiate', token, 'POST', { amount: 500, email: 'someone-else@example.com' });
  assert.equal(initialized.status, 200);
  const quote = await initialized.json();
  t.mock.method(require('../services/walletService'), 'fetchPaystackTransaction', async ref => ({ reference: ref, status: 'success', amount: 50000, currency: 'NGN' }));
  const replies = await Promise.all(Array.from({ length: 3 }, () => call('/wallet/deposit/paystack/verify', token, 'POST', { reference })));
  assert.ok(replies.every(r => r.status === 200));
  assert.equal((await Wallet.findOne({ userId })).balance, quote.creditedAmount);
  assert.equal(await Entry.countDocuments(), 1);
});

test('airtime provider is called after reservation; a timeout stays pending and does not resend', async t => {
  const { userId, token } = await authenticatedUser('user');
  await require('../model/User').updateOne({ _id: userId }, { $set: { transactionPin: '1234' } });
  await Wallet.create({ userId, balance: 1000 });
  const { Provider } = require('../model/Provider');
  await Provider.deleteMany({});
  await Provider.create({ name: 'vtpass', displayName: 'Test', description: 'Isolated test', credentials: { apiKey: 'test' },
    baseUrl: 'https://example.invalid', supportedServices: ['airtime'], isDefault: true });
  let sends = 0;
  t.mock.method(require('../services/vtpassService').constructor.prototype, 'makePayment', async payload => {
    sends++;
    assert.equal((await Wallet.findOne({ userId })).balance, 500);
    assert.ok(await Utility.findOne({ requestId: payload.request_id }));
    throw new Error('simulated provider timeout');
  });
  const body = { serviceID: 'mtn', phone: '08012345678', amount: 500, transactionPin: '1234' };
  const first = await call('/users/airtime', token, 'POST', body);
  assert.equal(first.status, 202, JSON.stringify(await first.clone().json()));
  assert.equal((await first.json()).transaction.status, 'pending');
  const retry = await call('/users/airtime', token, 'POST', body);
  assert.equal(retry.status, 202);
  assert.equal(sends, 1);
});

test('existing PIN cannot be replaced without the current PIN; responses do not leak secrets', async () => {
  const { userId, token } = await authenticatedUser('user');
  const User = require('../model/User');
  await User.updateOne({ _id: userId }, { $set: { transactionPin: '1234', password: 'private-password-hash' } });
  const denied = await call('/users', token, 'PATCH', { transactionPin: '5678' });
  assert.equal(denied.status, 400);
  const changed = await call('/users', token, 'PATCH', { transactionPin: '5678', currentTransactionPin: '1234' });
  assert.equal(changed.status, 200);
  const profile = await changed.json();
  assert.equal(profile.hasTransactionPin, true);
  assert.equal(profile.transactionPin, undefined);
  assert.equal(profile.transactionPinHash, undefined);
  assert.equal(profile.password, undefined);
  const record = await User.findById(userId).select('+transactionPin +transactionPinHash');
  assert.equal(record.transactionPin, null);
  assert.ok(await require('bcrypt').compare('5678', record.transactionPinHash));
});

test('valid legacy PIN verification migrates to a hash without exposing the PIN', async () => {
  const { userId } = await authenticatedUser('user');
  const User = require('../model/User');
  await User.updateOne({ _id: userId }, { $set: { transactionPin: '1234' } });
  const pins = require('../services/pinService');
  assert.equal(await pins.verify(userId, '0000'), false);
  assert.equal(await pins.verify(userId, '1234'), true);
  const record = await User.findById(userId).select('+transactionPin +transactionPinHash');
  assert.ok(record.transactionPinHash);
  assert.ok(!record.transactionPin);
});

test('requery preserves a confirmed provider failure so the worker can refund', async t => {
  const service = new (require('../services/vtpassService').constructor)();
  t.mock.method(service, 'updateProviderMetrics', async () => {});
  t.mock.method(require('axios'), 'post', async () => ({ data: { code: '016', content: { transactions: { status: 'failed' } } } }));
  const outcome = await service.requeryTransaction('test-request');
  assert.equal(purchases.normalize('vtpass', outcome).status, 'failed');
});

test('session data survives a new store instance and expired sessions are rejected', async () => {
  const Store = require('../services/sessionStore');
  const write = new Store();
  const read = new Store();
  await new Promise((resolve, reject) => write.set('session-test', { cookie: { expires: new Date(Date.now() + 60000) }, csrfSecret: 'test-only' }, error => error ? reject(error) : resolve()));
  const value = await new Promise((resolve, reject) => read.get('session-test', (error, data) => error ? reject(error) : resolve(data)));
  assert.equal(value.csrfSecret, 'test-only');
  await mongoose.model('Session').updateOne({ _id: 'session-test' }, { $set: { expires: new Date(0) } });
  const expired = await new Promise((resolve, reject) => read.get('session-test', (error, data) => error ? reject(error) : resolve(data)));
  assert.equal(expired, null);
});

test('read-only deployment preflight runs against the isolated replica set', async () => {
  const { execFile } = require('node:child_process');
  const result = await require('node:util').promisify(execFile)(process.execPath, ['scripts/payment-preflight.js'], {
    env: { ...process.env, MONGODB_URI: mongo.getUri() },
  });
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.transactionCapable, true);
  assert.equal(summary.duplicateWalletOwners, 0);
});
