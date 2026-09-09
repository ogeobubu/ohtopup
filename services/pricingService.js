const crypto = require('crypto');
const Rule = require('../model/PricingRule');
const { toKobo } = require('../utils/money');
const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
const rate = value => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value >= 100 || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) fail('Discount and percentage commission must be between 0 and 99.99, with at most two decimal places');
  return value;
};
const validateRule = input => {
  if (!['vtpass', 'clubkonnect'].includes(input.provider) || !['airtime', 'data', 'cable', 'electricity'].includes(input.service)) fail('Invalid provider or service');
  if (input.provider === 'clubkonnect' && !['airtime', 'data'].includes(input.service)) fail('ClubKonnect supports airtime and data in this integration');
  const network = String(input.network || '*').trim().toLowerCase();
  const planCode = String(input.planCode || '').trim();
  if (!/^(\*|[a-z0-9-]{1,80})$/.test(network) || planCode.length > 150) fail('Invalid network or plan code');
  if (['airtime', 'data'].includes(input.service) && !['*', 'mtn', 'airtel', 'glo', '9mobile'].includes(network)) fail('Select a valid mobile network');
  if (input.service === 'cable' && !['*', 'dstv', 'gotv', 'startimes'].includes(network)) fail('Select a valid cable service ID');
  if (input.service === 'electricity' && !['*', 'ikeja-electric', 'eko-electric', 'abuja-electric', 'ibadan-electric', 'enugu-electric', 'portharcourt-electric', 'kano-electric', 'jos-electric', 'kaduna-electric', 'benin-electric', 'yola-electric'].includes(network)) fail('Select a valid electricity service ID');
  if (planCode && !['data', 'cable'].includes(input.service)) fail('Plan overrides apply to data or cable');
  const providerCommissionType = input.providerCommissionType || 'percentage';
  if (!['percentage', 'flat'].includes(providerCommissionType)) fail('Invalid commission type');
  const providerCommissionRate = providerCommissionType === 'percentage' ? rate(input.providerCommissionRate) : toKobo(input.providerCommissionRate, { allowZero: true }) / 100;
  const customerDiscountRate = rate(input.customerDiscountRate);
  const providerCommissionCap = input.providerCommissionCap == null ? null : toKobo(input.providerCommissionCap, { allowZero: true }) / 100;
  if (providerCommissionType === 'percentage' && customerDiscountRate > providerCommissionRate) fail('Customer discount cannot exceed provider commission');
  return { provider: input.provider, service: input.service, network, planCode, providerCommissionType, providerCommissionRate, providerCommissionCap, customerDiscountRate };
};
const findRule = async ({ provider, type, network, serviceID, planCode }) => {
  const scope = network || serviceID;
  const rules = await Rule.find({ provider, service: type, network: { $in: ['*', scope] }, planCode: { $in: ['', planCode || ''] } }).lean();
  return rules.sort((a, b) => ((b.planCode ? 2 : 0) + (b.network !== '*' ? 1 : 0)) - ((a.planCode ? 2 : 0) + (a.network !== '*' ? 1 : 0)))[0];
};
const round2 = v => Math.round(v * 100) / 100;
const calculate = ({ amount, retailAmount = amount, rule, legacyRate = 0 }) => {
  const face = toKobo(round2(amount)), retail = toKobo(round2(retailAmount));
  const customerDiscountRate = rate(Number(rule ? rule.customerDiscountRate : legacyRate));
  const discount = Math.round(retail * customerDiscountRate / 100);
  const charge = retail - discount;
  if (charge <= 0) fail('Customer price must be positive');
  let providerCost = null;
  if (rule) {
    let commission = rule.providerCommissionType === 'flat' ? toKobo(rule.providerCommissionRate, { allowZero: true }) : Math.round(face * rate(Number(rule.providerCommissionRate)) / 100);
    if (rule.providerCommissionCap != null) commission = Math.min(commission, toKobo(rule.providerCommissionCap, { allowZero: true }));
    if (commission > face) fail('Provider commission exceeds purchase value');
    providerCost = face - commission;
    if (charge < providerCost) fail('Customer discount would sell below the configured provider cost');
  }
  return { version: 1, faceValue: face / 100, retailAmount: retail / 100, customerDiscountRate, customerDiscountAmount: discount / 100,
    customerCharge: charge / 100, estimatedProviderCost: providerCost == null ? null : providerCost / 100,
    estimatedPlatformMargin: providerCost == null ? null : (charge - providerCost) / 100,
    ruleId: rule ? String(rule._id) : null, providerCommissionType: rule?.providerCommissionType || null,
    providerCommissionRate: rule?.providerCommissionRate ?? null, providerCommissionCap: rule?.providerCommissionCap ?? null };
};
const publicQuote = (pricing, identity) => ({ amount: pricing.faceValue, retailAmount: pricing.retailAmount,
  customerDiscountRate: pricing.customerDiscountRate, customerDiscountAmount: pricing.customerDiscountAmount,
  customerCharge: pricing.customerCharge,
  pricingKey: crypto.createHash('sha256').update(JSON.stringify({ pricing, identity })).digest('hex') });
// Provider amounts are reported with floating point noise; normalize to kobo once.
const actualCost = (provider, raw) => {
  const value = provider === 'vtpass' ? raw.content?.transactions?.total_amount : raw.amountcharged;
  if (value == null || value === '' || !['number', 'string'].includes(typeof value)) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isSafeInteger(Math.round(parsed * 100))) return null;
  return Math.round(parsed * 100) / 100;
};
module.exports = { validateRule, findRule, calculate, publicQuote, actualCost };

// Shared by public plan listings and checkout; the provider face value remains unchanged.
module.exports.planPricing = async plan => {
  const provider = plan.providerName || plan.provider?.name;
  const network = plan.network.toLowerCase();
  const rule = await findRule({ provider, type: 'data', network, serviceID: plan.serviceId, planCode: plan.planId });
  let legacyRate = 0;
  if (!rule) {
    const settings = await require('../model/AirtimeSettings').find({ isActive: true }).lean();
    legacyRate = settings.find(s => s.type === 'network' && s.network === network)?.settings?.dataCommissionRate ?? settings.find(s => s.type === 'global')?.settings?.dataCommissionRate ?? 0;
  }
  return calculate({ amount: plan.amount, retailAmount: plan.adminPrice ?? plan.amount, rule, legacyRate });
};
