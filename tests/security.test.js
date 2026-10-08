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
