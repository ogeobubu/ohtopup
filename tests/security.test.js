const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldSkipCsrf } = require('../middleware/csrfPolicy');

const request = (path, headers = {}) => ({ path, headers });

test('CSRF policy does not trust a caller-supplied mobile header', () => {
  assert.equal(shouldSkipCsrf(request('/api/users/airtime', { 'x-mobile-app': 'true' })), false);
  assert.equal(shouldSkipCsrf(request('/api/users/settings', { 'x-mobile-app': 'true' })), false);
});

test('CSRF policy permits bearer APIs and only explicit public mutations', () => {
  assert.equal(shouldSkipCsrf(request('/api/users/airtime', { authorization: 'Bearer signed-token' })), true);
  assert.equal(shouldSkipCsrf(request('/api/users/login')), true);
  assert.equal(shouldSkipCsrf(request('/api/users/wallet/deposit/paystack/webhook')), true);
  assert.equal(shouldSkipCsrf(request('/api/users/arbitrary')), false);
});

test('background job authentication rejects missing and incorrect secrets', t => {
  const original = process.env.BACKGROUND_JOB_SECRET;
  t.after(() => { if (original === undefined) delete process.env.BACKGROUND_JOB_SECRET; else process.env.BACKGROUND_JOB_SECRET = original; });
  const authenticate = require('../middleware/jobAuth');
  const response = () => ({ statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
  process.env.BACKGROUND_JOB_SECRET = 'scheduler-secret';
  for (const authorization of [undefined, 'Bearer wrong-secret']) {
    const res = response();
    let continued = false;
    authenticate({ headers: { authorization } }, res, () => { continued = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(continued, false);
  }
  let continued = false;
  authenticate({ headers: { authorization: 'Bearer scheduler-secret' } }, response(), () => { continued = true; });
  assert.equal(continued, true);
});
