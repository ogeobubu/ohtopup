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
const { BetDiceGame, BetDiceGameSettings } = require('../model/BetDiceGame');
const SystemLog = require('../model/SystemLog');
const AuthSession = require('../model/AuthSession');
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
  await Promise.all([Wallet, Transaction, Entry, Utility, Event, Audit, BetDiceGame, BetDiceGameSettings, SystemLog, AuthSession].map(m => m.init()));
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
beforeEach(async () => { await Promise.all([Wallet, Transaction, Entry, Utility, Event, Audit, BetDiceGame, BetDiceGameSettings, SystemLog, AuthSession].map(m => m.deleteMany({}))); });
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
test('payment operations surfaces stale work and requeues review events idempotently', async () => {
  const event = await Event.create({ key: 'review-event', payload: { event: 'charge.success', data: { reference: 'safe-reference' } }, status: 'review', attempts: 12, lastError: 'provider unavailable' });
  const staleDate = new Date(Date.now() - 20 * 60 * 1000);
  const purchase = await Utility.create({ requestId: 'stale-purchase', serviceID: 'mtn', status: 'pending', type: 'airtime', product_name: 'Airtime', amount: 100, revenue: 0, phone: '08000000000', commissionRate: 0, user: new mongoose.Types.ObjectId() });
  await Utility.updateOne({ _id: purchase._id }, { $set: { createdAt: staleDate, updatedAt: staleDate } }, { timestamps: false });
  const operations = require('../services/paymentOperationsService');
  const overview = await operations.getOverview();
  assert.equal(overview.summary.reviewEvents, 1);
  assert.equal(overview.summary.stalePurchases, 1);
  assert.equal(overview.reviewEvents[0].payload, undefined, 'raw webhook payload is not exposed');

  const results = await Promise.all([operations.requeueEvent(event._id), operations.requeueEvent(event._id)]);
  assert.equal(results.filter(result => result.duplicate === false).length, 1);
  assert.equal((await Event.findById(event._id)).status, 'pending');
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
    ['/users/admin/rewards', 'GET'], ['/users/electricity/settings', 'PUT'], ['/admin/users/analytics', 'GET'], ['/admin/newsletter/send', 'POST'], ['/admin/payment-operations', 'GET']]) {
    assert.equal((await call(path, token, method, method !== 'GET' ? {} : undefined)).status, 403, path);
  }
});
test('administrators can view payment health and requeue a review event', async () => {
  const { token } = await authenticatedUser('admin');
  const event = await Event.create({ key: 'admin-review-event', payload: { event: 'charge.success', data: { reference: 'admin-reference' } }, status: 'review', attempts: 12 });
  const overview = await call('/admin/payment-operations', token);
  assert.equal(overview.status, 200);
  assert.equal((await overview.json()).summary.reviewEvents, 1);
  const response = await call(`/admin/payment-operations/events/${event._id}/requeue`, token, 'POST', {});
  assert.equal(response.status, 200);
  assert.equal((await Event.findById(event._id)).status, 'pending');
  assert.equal(await SystemLog.countDocuments({ category: 'payment', 'metadata.eventId': event._id }), 1);
});
test('forged token roles and deleted accounts do not retain access', async () => {
  const { userId, token } = await authenticatedUser('admin');
  await require('../model/User').updateOne({ _id: userId }, { $set: { role: 'user' } });
  assert.equal((await call('/wallet/all', token)).status, 403);
  await require('../model/User').updateOne({ _id: userId }, { $set: { isDeleted: true } });
  assert.equal((await call('/wallet', token)).status, 401);
});
test('refresh tokens rotate, are stored hashed, and reuse revokes the token family', async () => {
  const User = require('../model/User');
  const password = 'strong-test-password';
  const user = await User.create({ username: `session-${Date.now()}`, email: `session-${Date.now()}@example.com`, phoneNumber: `+447700${String(Date.now()).slice(-6)}`, password: await require('bcrypt').hash(password, 10), source: 'test', isVerified: true });
  const authService = require('../services/authService');
  const login = await authService.loginUser(user.email, password, { userAgent: 'Test Browser', ipAddress: '127.0.0.1' });
  const stored = await AuthSession.findOne({ userId: user._id }).select('+tokenHash');
  assert.ok(stored);
  assert.notEqual(stored.tokenHash, login.refreshToken);
  assert.equal((await authService.listSessions(user._id)).length, 1);

  const rotated = await authService.refreshAccessToken(login.refreshToken, { userAgent: 'Test Browser', ipAddress: '127.0.0.1' });
  assert.notEqual(rotated.refreshToken, login.refreshToken);
  await assert.rejects(authService.refreshAccessToken(login.refreshToken), error => error.status === 401 && /reuse/i.test(error.message));
  await assert.rejects(authService.refreshAccessToken(rotated.refreshToken), error => error.status === 401);
  assert.equal((await authService.listSessions(user._id)).length, 0);
});
test('users can list and revoke only their own active sessions', async () => {
  const first = await authenticatedUser('user');
  const second = await authenticatedUser('user');
  const foreign = await AuthSession.create({ userId: second.userId, tokenHash: crypto.randomBytes(32).toString('hex'), familyId: crypto.randomUUID(), expiresAt: new Date(Date.now() + 60000) });
  assert.equal((await call('/users/sessions', first.token)).status, 200);
  assert.equal((await call(`/users/sessions/${foreign._id}`, first.token, 'DELETE')).status, 404);
  assert.equal((await AuthSession.findById(foreign._id)).revokedAt, undefined);
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

test('bet dice settings are customer-safe and repeated wager keys debit once', async () => {
  const { userId, token } = await authenticatedUser('user');
  const wallet = await Wallet.create({ userId, balance: 1000 });
  const settingsResponse = await call('/users/bet-dice/settings', token);
  assert.equal(settingsResponse.status, 200);
  const publicSettings = (await settingsResponse.json()).settings;
  assert.equal(publicSettings.manipulation, undefined);
  assert.equal(publicSettings.riskManagement, undefined);

  const body = { betAmount: 50, odds: 20, difficulty: 'easy', diceCount: 2 };
  const quoteResponse = await call('/users/bet-dice/quote', token, 'POST', body);
  assert.equal(quoteResponse.status, 200);
  const quote = await quoteResponse.json();
  assert.equal(quote.odds, 1.2, 'server chooses configured odds instead of client odds');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': 'same-wager' };
  const responses = await Promise.all(Array.from({ length: 2 }, () => fetch(`${baseUrl}/users/bet-dice/play`, {
    method: 'POST', headers, body: JSON.stringify({ quoteToken: quote.quoteToken }),
  })));
  assert.ok(responses.every(response => response.status === 200));
  assert.equal(await BetDiceGame.countDocuments({ user: userId }), 1);
  const game = await BetDiceGame.findOne({ user: userId });
  assert.equal(game.odds, 1.2);
  assert.equal(game.betAmountKobo, 5000);
  assert.equal(await Entry.countDocuments({ walletId: wallet._id, reason: 'Game entry' }), 1);
  assert.ok((await Wallet.findById(wallet._id)).balanceKobo >= 95000);

  const changedQuoteResponse = await call('/users/bet-dice/quote', token, 'POST', { ...body, betAmount: 60 });
  const changedQuote = await changedQuoteResponse.json();
  const changed = await fetch(`${baseUrl}/users/bet-dice/play`, { method: 'POST', headers, body: JSON.stringify({ quoteToken: changedQuote.quoteToken }) });
  assert.equal(changed.status, 409);
  const tampered = await fetch(`${baseUrl}/users/bet-dice/play`, { method: 'POST', headers: { ...headers, 'Idempotency-Key': 'tampered-wager' }, body: JSON.stringify({ quoteToken: `${quote.quoteToken}x` }) });
  assert.equal(tampered.status, 400);
});

test('bet dice quotes are bound to one customer and failed wagers never debit the wallet', async () => {
  const first = await authenticatedUser('user');
  const second = await authenticatedUser('user');
  const firstWallet = await Wallet.create({ userId: first.userId, balance: 100 });
  const secondWallet = await Wallet.create({ userId: second.userId, balance: 25 });
  const selection = { betAmount: 50, difficulty: 'easy', diceCount: 2 };
  const quoteResponse = await call('/users/bet-dice/quote', first.token, 'POST', selection);
  assert.equal(quoteResponse.status, 200);
  const quote = await quoteResponse.json();

  const foreignPlay = await fetch(`${baseUrl}/users/bet-dice/play`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${second.token}`, 'Content-Type': 'application/json', 'Idempotency-Key': 'foreign-quote' },
    body: JSON.stringify({ quoteToken: quote.quoteToken }),
  });
  assert.equal(foreignPlay.status, 403);
  assert.equal((await Wallet.findById(secondWallet._id)).balance, 25);

  await Wallet.updateOne({ _id: firstWallet._id }, { $set: { balance: 25, balanceKobo: 2500 } });
  const insufficientPlay = await fetch(`${baseUrl}/users/bet-dice/play`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${first.token}`, 'Content-Type': 'application/json', 'Idempotency-Key': 'insufficient-funds' },
    body: JSON.stringify({ quoteToken: quote.quoteToken }),
  });
  assert.equal(insufficientPlay.status, 400);
  assert.equal((await Wallet.findById(firstWallet._id)).balanceKobo, 2500);
  assert.equal(await BetDiceGame.countDocuments(), 0);
  assert.equal(await Entry.countDocuments(), 0);
});

test('bet dice refuses quotes while disabled or under maintenance', async () => {
  const { token } = await authenticatedUser('user');
  const selection = { betAmount: 50, difficulty: 'easy', diceCount: 2 };
  const config = await BetDiceGameSettings.create({ gameEnabled: false });
  assert.equal((await call('/users/bet-dice/quote', token, 'POST', selection)).status, 400);
  await BetDiceGameSettings.updateOne({ _id: config._id }, { $set: { gameEnabled: true, maintenanceMode: true } });
  assert.equal((await call('/users/bet-dice/quote', token, 'POST', selection)).status, 400);
  assert.equal(await BetDiceGame.countDocuments(), 0);
  assert.equal(await Entry.countDocuments(), 0);
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

test('admin-only commission rules drive quotes, wallet debit, provider face value and realized margin', async t => {
  const Rule = require('../model/PricingRule');
  await Rule.deleteMany({});
  t.after(() => Rule.deleteMany({}));
  const { userId, token } = await authenticatedUser('user');
  const admin = await authenticatedUser('admin');
  await require('../model/User').updateOne({ _id: userId }, { $set: { transactionPin: '1234' } });
  await Wallet.create({ userId, balance: 1000 });
  const { Provider } = require('../model/Provider');
  await Provider.deleteMany({});
  await Provider.create({ name: 'vtpass', displayName: 'Test', description: 'Test', credentials: { apiKey: 'test' }, baseUrl: 'https://example.invalid', supportedServices: ['airtime'], isDefault: true });
  const settings = { provider: 'vtpass', service: 'airtime', network: 'mtn', providerCommissionRate: 2, customerDiscountRate: 1 };
  assert.equal((await call('/admin/pricing-rules', token, 'PUT', settings)).status, 403);
  assert.equal((await call('/admin/pricing-rules', admin.token, 'PUT', { ...settings, customerDiscountRate: 3 })).status, 400);
  assert.equal((await call('/admin/pricing-rules', admin.token, 'PUT', settings)).status, 200);
  const input = { serviceID: 'mtn', phone: '08012345678', amount: 100, transactionPin: '1234' };
  const quoted = await call('/users/purchase-quote/airtime', token, 'POST', { ...input, transactionPin: undefined });
  assert.equal(quoted.status, 200, JSON.stringify(await quoted.clone().json()));
  const quote = await quoted.json();
  assert.equal(quote.customerCharge, 99);
  assert.equal(quote.estimatedProviderCost, undefined);
  assert.equal((await Wallet.findOne({ userId })).balance, 1000);
  assert.equal((await call('/users/airtime', token, 'POST', input)).status, 409);
  let sends = 0;
  t.mock.method(require('../services/vtpassService').constructor.prototype, 'makePayment', async payload => {
    sends++;
    assert.equal(payload.amount, 100);
    assert.equal((await Wallet.findOne({ userId })).balance, 901);
    return { code: '000', content: { transactions: { status: 'delivered', total_amount: 98 } } };
  });
  const result = await call('/users/airtime', token, 'POST', { ...input, pricingKey: quote.pricingKey });
  assert.equal(result.status, 201, JSON.stringify(await result.clone().json()));
  assert.equal(sends, 1);
  const tx = await Utility.findOne({ user: userId });
  assert.equal(tx.pricing.customerDiscountAmount, 1);
  assert.equal(tx.pricing.actualProviderCost, 98);
  assert.equal(tx.pricing.actualPlatformMargin, 1);
  assert.equal(tx.debitKobo, 9900);
  const summary = await (await call('/admin/pricing-rules', admin.token)).json();
  assert.equal(summary.summary.confirmedMargin, 1);
  await call('/admin/pricing-rules', admin.token, 'PUT', { ...settings, customerDiscountRate: 0 });
  assert.equal((await call('/users/airtime', token, 'POST', { ...input, pricingKey: quote.pricingKey })).status, 409);
  assert.equal(sends, 1);
});

test('network and plan pricing overrides take precedence, including explicit zero', async t => {
  const Rule = require('../model/PricingRule');
  await Rule.deleteMany({});
  t.after(() => Rule.deleteMany({}));
  const base = { provider: 'clubkonnect', service: 'data', providerCommissionRate: 2, customerDiscountRate: 1 };
  await Rule.create([{ ...base, network: '*' }, { ...base, network: 'mtn', customerDiscountRate: 0 }, { ...base, network: 'mtn', planCode: '100MB', customerDiscountRate: 0.5 }]);
  const service = require('../services/pricingService');
  assert.equal((await service.findRule({ provider: 'clubkonnect', type: 'data', network: 'mtn' })).customerDiscountRate, 0);
  assert.equal((await service.findRule({ provider: 'clubkonnect', type: 'data', network: 'mtn', planCode: '100MB' })).customerDiscountRate, 0.5);
  assert.equal((await service.findRule({ provider: 'clubkonnect', type: 'data', network: 'glo' })).customerDiscountRate, 1);
});

test('failed discounted purchases refund the actual customer debit once and never earn margin', async () => {
  const { userId, wallet } = await fixture();
  const pricing = require('../services/pricingService').calculate({ amount: 100, rule: { providerCommissionType: 'percentage', providerCommissionRate: 2, customerDiscountRate: 1 } });
  const { transaction } = await purchases.begin({ userId, key: 'discounted-refund', fingerprint: 'discounted-refund', amount: 100, cost: 99, pricing, serviceID: 'mtn', contact: '08012345678', type: 'airtime', provider: 'clubkonnect' });
  assert.equal((await Wallet.findById(wallet._id)).balance, 901);
  await purchases.finish(transaction.requestId, { status: 'ORDER_FAILED' });
  await purchases.finish(transaction.requestId, { status: 'ORDER_FAILED' });
  assert.equal((await Wallet.findById(wallet._id)).balance, 1000);
  assert.equal((await Utility.findById(transaction._id)).pricing.actualPlatformMargin, 0);
  assert.equal(await Entry.countDocuments(), 2);
});

for (const providerName of ['vtpass', 'clubkonnect']) test(`${providerName} data quote uses current catalog price and retains configured margin`, async t => {
  const Rule = require('../model/PricingRule');
  const Plan = require('../model/SelectedDataPlan');
  const { Provider } = require('../model/Provider');
  await Promise.all([Rule.deleteMany({}), Plan.deleteMany({}), Provider.deleteMany({})]);
  t.after(() => Promise.all([Rule.deleteMany({}), Plan.deleteMany({})]));
  const { userId, token } = await authenticatedUser('user');
  await require('../model/User').updateOne({ _id: userId }, { $set: { transactionPin: '1234' } });
  await Wallet.create({ userId, balance: 1000 });
  const provider = await Provider.create({ name: providerName, displayName: 'Test', description: 'Test', credentials: { apiKey: 'test' }, baseUrl: 'https://example.invalid', supportedServices: ['data'], isDefault: true });
  await Plan.create({ provider: provider._id, providerName, planId: '100mb', serviceId: 'mtn-data', name: '100MB', displayName: '100MB', amount: 90, network: 'MTN', dataAmount: '100MB', validity: '1 day' });
  await Rule.create({ provider: providerName, service: 'data', network: 'mtn', providerCommissionRate: 2, customerDiscountRate: 1 });
  let livePrice = 100;
  const prototype = require(providerName === 'vtpass' ? '../services/vtpassService' : '../services/clubkonnectService').constructor.prototype;
  if (providerName === 'vtpass') {
    t.mock.method(prototype, 'getServiceVariations', async () => ({ success: true, variations: [{ variation_code: '100mb', variation_amount: livePrice }] }));
  } else {
    t.mock.method(prototype, 'getDataPlans', async () => ({ success: true, plans: [{ productCode: '100mb', productId: 'provider-product', networkId: '01', amount: livePrice }] }));
  }
  let sends = 0;
  t.mock.method(prototype, providerName === 'vtpass' ? 'makePayment' : 'purchaseData', async (...args) => {
    sends++;
    if (providerName === 'vtpass') assert.equal(args[0].amount, 100);
    else assert.deepEqual(args.slice(0, 3), ['01', 'provider-product', '08012345678']);
    return providerName === 'vtpass' ? { code: '000', content: { transactions: { status: 'delivered', total_amount: 98 } } } : { status: 'ORDER_COMPLETED', amountcharged: '98.00' };
  });
  const input = { serviceID: 'mtn-data', billersCode: '08012345678', phone: '08012345678', amount: 90, variation_code: '100mb', provider: providerName, transactionPin: '1234' };
  const response = await call('/users/purchase-quote/data', token, 'POST', input);
  assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
  const quote = await response.json();
  assert.equal(quote.amount, 100);
  assert.equal(quote.customerCharge, 99);
  livePrice = 110;
  assert.equal((await call('/users/data', token, 'POST', { ...input, amount: quote.amount, pricingKey: quote.pricingKey })).status, 409);
  assert.equal((await Wallet.findOne({ userId })).balance, 1000);
  livePrice = 100;
  const delivered = await call('/users/data', token, 'POST', { ...input, amount: quote.amount, pricingKey: quote.pricingKey });
  assert.equal(delivered.status, 201, JSON.stringify(await delivered.clone().json()));
  assert.equal(sends, 1);
  assert.equal((await Wallet.findOne({ userId })).balance, 901);
  assert.equal((await Utility.findOne({ user: userId })).pricing.actualPlatformMargin, 1);
});

test('missing provider cost stays unknown until requery and a higher actual cost is recorded as a loss', async () => {
  const { userId } = await fixture();
  const pricing = require('../services/pricingService').calculate({ amount: 100, rule: { providerCommissionType: 'percentage', providerCommissionRate: 2, customerDiscountRate: 1 } });
  const { transaction } = await purchases.begin({ userId, key: 'late-provider-cost', fingerprint: 'late-provider-cost', amount: 100, cost: 99, pricing, serviceID: 'mtn', contact: '08012345678', type: 'airtime', provider: 'vtpass' });
  const delivered = await purchases.finish(transaction.requestId, { code: '000', content: { transactions: { status: 'delivered' } } });
  assert.equal(delivered.pricing.actualPlatformMargin, null);
  const updated = await purchases.finish(transaction.requestId, { code: '000', content: { transactions: { status: 'delivered', total_amount: 100 } } });
  assert.equal(updated.pricing.actualPlatformMargin, -1);
  assert.equal(updated.pricing.costVariance, 2);
  assert.equal((await Wallet.findOne({ userId })).balance, 901, 'provider cost changes do not change the customer charge');
});

for (const type of ['cable', 'electricity']) test(`${type} customer discount is confirmed before the full service value reaches VTPass`, async t => {
  const Rule = require('../model/PricingRule');
  const { Provider } = require('../model/Provider');
  await Promise.all([Rule.deleteMany({}), Provider.deleteMany({})]);
  t.after(() => Rule.deleteMany({}));
  const { userId, token } = await authenticatedUser('user');
  await require('../model/User').updateOne({ _id: userId }, { $set: { transactionPin: '1234' } });
  await Wallet.create({ userId, balance: 2000 });
  await Provider.create({ name: 'vtpass', displayName: 'Test', description: 'Test', credentials: { apiKey: 'test' }, baseUrl: 'https://example.invalid', supportedServices: [type], isDefault: true });
  const serviceID = type === 'cable' ? 'dstv' : 'ikeja-electric';
  await Rule.create({ provider: 'vtpass', service: type, network: serviceID, providerCommissionRate: 2, customerDiscountRate: 1 });
  if (type === 'cable') {
    t.mock.method(require('axios'), 'post', async () => ({ data: { code: '000', content: { Renewal_Amount: 1000 } } }));
  } else {
    const settings = require('../services/electricitySettingsService');
    t.mock.method(settings, 'getAmountLimits', async () => ({ success: true, minAmount: 1000, maxAmount: 50000 }));
    t.mock.method(settings, 'getCommissionRate', async () => ({ success: true, commissionRate: 0 }));
  }
  t.mock.method(require('../services/vtpassService').constructor.prototype, 'makePayment', async input => {
    assert.equal(input.amount, 1000);
    assert.equal((await Wallet.findOne({ userId })).balance, 1010);
    return { code: '000', purchased_code: 'test-token', content: { transactions: { status: 'delivered', total_amount: 980 } } };
  });
  const input = { serviceID, billersCode: '1234567890', phone: '08012345678', amount: 1000, transactionPin: '1234', ...(type === 'cable' ? { subscription_type: 'renew' } : { variation_code: 'prepaid' }) };
  const response = await call(`/users/purchase-quote/${type}`, token, 'POST', input);
  assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
  const quote = await response.json();
  assert.equal(quote.customerCharge, 990);
  const purchase = await call(`/users/${type}`, token, 'POST', { ...input, pricingKey: quote.pricingKey });
  assert.equal(purchase.status, 201, JSON.stringify(await purchase.clone().json()));
  const tx = await Utility.findOne({ user: userId });
  assert.equal(tx.pricing.actualPlatformMargin, 10);
});
