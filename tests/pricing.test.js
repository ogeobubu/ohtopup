const { test } = require('node:test');
const assert = require('node:assert/strict');
const pricing = require('../services/pricingService');
const rule = { provider: 'vtpass', service: 'data', network: 'mtn', providerCommissionType: 'percentage', providerCommissionRate: 2, customerDiscountRate: 1 };
test('2% provider commission and 1% customer discount retain ₦1 on ₦100', () => {
  const result = pricing.calculate({ amount: 100, rule });
  assert.equal(result.customerCharge, 99);
  assert.equal(result.estimatedProviderCost, 98);
  assert.equal(result.estimatedPlatformMargin, 1);
});
test('zero discount is respected and precision is retained to kobo', () => {
  assert.equal(pricing.calculate({ amount: 100, rule: { ...rule, customerDiscountRate: 0 } }).customerCharge, 100);
  assert.equal(pricing.calculate({ amount: 123.45, rule: { ...rule, customerDiscountRate: 1.25 } }).customerCharge, 121.91);
});
test('flat and capped rates and admin prices cannot produce a configured loss', () => {
  assert.throws(() => pricing.calculate({ amount: 1000, rule: { ...rule, providerCommissionCap: 5 } }), /below/);
  assert.throws(() => pricing.calculate({ amount: 100, retailAmount: 90, rule }), /below/);
  const result = pricing.calculate({ amount: 100, rule: { ...rule, providerCommissionType: 'flat', providerCommissionRate: 2 } });
  assert.equal(result.estimatedPlatformMargin, 1);
});
test('invalid rates and scopes are rejected', () => {
  for (const customerDiscountRate of [3, -1, 100, NaN, Infinity, '1', 1.111]) assert.throws(() => pricing.validateRule({ ...rule, customerDiscountRate }));
  assert.throws(() => pricing.validateRule({ ...rule, provider: 'unknown' }));
  assert.throws(() => pricing.validateRule({ ...rule, provider: 'clubkonnect', service: 'electricity' }));
});
test('legacy pricing does not invent provider costs and quotes hide internal margin', () => {
  const result = pricing.calculate({ amount: 100, legacyRate: 1 });
  assert.equal(result.customerCharge, 99);
  assert.equal(result.estimatedProviderCost, null);
  const quote = pricing.publicQuote(pricing.calculate({ amount: 100, rule }), { provider: 'vtpass' });
  assert.equal(quote.estimatedPlatformMargin, undefined);
  assert.notEqual(quote.pricingKey, pricing.publicQuote(pricing.calculate({ amount: 100, rule: { ...rule, customerDiscountRate: 0 } }), { provider: 'vtpass' }).pricingKey);
});
test('provider actual debit parsing never invents costs from absent fields', () => {
  assert.equal(pricing.actualCost('vtpass', { content: { transactions: { total_amount: 98.00000000001 } } }), 98);
  assert.equal(pricing.actualCost('clubkonnect', { amountcharged: '98.00' }), 98);
  for (const raw of [{}, { amountcharged: '' }, { amountcharged: 'bad' }, { amountcharged: -1 }]) assert.equal(pricing.actualCost('clubkonnect', raw), null);
});
