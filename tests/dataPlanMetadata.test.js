const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeDataPlanMetadata } = require('../utils/dataPlanMetadata');

test('repairs legacy provider codes and incorrect daily categories from explicit descriptions', () => {
  assert.deepEqual(normalizeDataPlanMetadata({ name: 'Glo Data (SME) N70 - 200MB - 14 days', dataAmount: 'glo-70', validity: 'Daily' }), { dataAmount: '200MB', validity: '14 days' });
  assert.deepEqual(normalizeDataPlanMetadata({ name: 'Airtel Data Bundle - 100 Naira - 75MB - 1Day' }), { dataAmount: '75MB', validity: '1 day' });
});

test('retains bonus allowances without inventing validity for night plans', () => {
  assert.deepEqual(normalizeDataPlanMetadata({ name: '45MB + 5MB Night N50 Oneoff', validity: 'Other' }), { dataAmount: '45MB + 5MB Night', validity: 'Unknown' });
});

test('uses explicit structured fields but never treats identifiers as allowances', () => {
  assert.deepEqual(normalizeDataPlanMetadata({ name: 'Special bundle', dataAmount: '1.5 GB', validity: '30 days' }), { dataAmount: '1.5GB', validity: '30 days' });
  assert.deepEqual(normalizeDataPlanMetadata({ name: 'Voice Bundle', dataAmount: 'plan-100', validity: 'Daily' }), { dataAmount: 'Unknown', validity: 'Unknown' });
});

test('keeps restrictions attached to the allowance they qualify', () => {
  assert.deepEqual(normalizeDataPlanMetadata({ name: '1 GB + 500 MB Social-only - 7 days' }), { dataAmount: '1GB + 500MB Social-only', validity: '7 days' });
});
