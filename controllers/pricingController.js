const Rule = require('../model/PricingRule');
const Utility = require('../model/Utility');
const pricing = require('../services/pricingService');
exports.list = async (req, res, next) => {
  try {
    const [rules, summary] = await Promise.all([Rule.find().sort({ provider: 1, service: 1, network: 1, planCode: 1 }).lean(),
      Utility.aggregate([{ $match: { status: 'delivered', 'pricing.version': 1 } }, { $group: { _id: null,
        customerCharges: { $sum: '$pricing.customerCharge' },
        customerDiscounts: { $sum: '$pricing.customerDiscountAmount' },
        confirmedMargin: { $sum: { $ifNull: ['$pricing.actualPlatformMargin', 0] } },
        unconfirmedTransactions: { $sum: { $cond: [{ $eq: [{ $ifNull: ['$pricing.actualProviderCost', null] }, null] }, 1, 0] } },
      } }])]);
    res.json({ rules, summary: summary[0] || { customerCharges: 0, customerDiscounts: 0, confirmedMargin: 0, unconfirmedTransactions: 0 } });
  } catch (e) { next(e); }
};
const networksForService = {
  airtime: ['mtn', 'airtel', 'glo', '9mobile'],
  data: ['mtn', 'airtel', 'glo', '9mobile'],
  cable: ['dstv', 'gotv', 'startimes'],
  electricity: ['ikeja-electric', 'eko-electric', 'abuja-electric', 'ibadan-electric', 'enugu-electric', 'portharcourt-electric', 'kano-electric', 'jos-electric', 'kaduna-electric', 'benin-electric', 'yola-electric'],
};
exports.options = async (req, res, next) => {
  try {
    const { provider, service, network } = req.query;
    const networks = networksForService[service] || [];
    let planCodes = [];
    if (service === 'data' && provider) {
      const SelectedPlan = require('../model/SelectedDataPlan');
      const query = { providerName: provider, isActive: true, isVisible: true };
      if (network) query.network = { $in: [network.toUpperCase(), network.toLowerCase()] };
      const plans = await SelectedPlan.find(query).select('planId displayName network amount adminPrice').sort({ network: 1, amount: 1 }).lean();
      planCodes = plans.map(p => ({ planId: p.planId, label: `${p.displayName} — ₦${p.adminPrice || p.amount}`, network: p.network.toLowerCase() }));
    } else if (service === 'cable' && provider) {
      const Variation = require('../model/Variation');
      const query = { isActive: true };
      if (network) query.serviceID = network;
      else query.serviceID = { $in: networksForService.cable };
      const variations = await Variation.find(query).select('variation_code name serviceID variation_amount').sort({ serviceID: 1, name: 1 }).lean();
      planCodes = variations.map(v => ({ planId: v.variation_code, label: `${v.name} — ₦${v.variation_amount}`, network: v.serviceID }));
    }
    res.json({ networks, planCodes });
  } catch (e) { next(e); }
};
exports.preview = async (req, res, next) => {
  try {
    const { provider, service, network = '*', planCode = '' } = req.query;
    const scope = network || '*';
    const rule = await pricing.findRule({ provider, type: service, network: scope, serviceID: scope, planCode });
    let legacyRate = 0;
    let legacySource = null;
    if (!rule) {
      const AirtimeSettings = require('../model/AirtimeSettings');
      const settings = await AirtimeSettings.find({ isActive: true }).lean();
      const serviceKey = service === 'airtime' ? 'airtimeCommissionRate' : 'dataCommissionRate';
      const networkEntry = settings.find(s => s.type === 'network' && s.network === scope);
      const globalEntry = settings.find(s => s.type === 'global');
      if (networkEntry?.settings?.[serviceKey]) {
        legacyRate = networkEntry.settings[serviceKey];
        legacySource = `network (${scope})`;
      } else if (globalEntry?.settings?.[serviceKey]) {
        legacyRate = globalEntry.settings[serviceKey];
        legacySource = 'global';
      }
    }
    res.json({
      matchedRule: rule ? { id: rule._id, provider: rule.provider, service: rule.service, network: rule.network, planCode: rule.planCode, providerCommissionType: rule.providerCommissionType, providerCommissionRate: rule.providerCommissionRate, providerCommissionCap: rule.providerCommissionCap, customerDiscountRate: rule.customerDiscountRate } : null,
      legacyRate: rule ? null : legacyRate,
      legacySource: rule ? null : legacySource,
      effectiveDiscountRate: rule ? rule.customerDiscountRate : legacyRate,
      source: rule ? `rule (${rule.network}${rule.planCode ? '/' + planCode : ''})` : legacySource || 'none',
    });
  } catch (e) { next(e); }
};
exports.save = async (req, res, next) => {
  try {
    const values = pricing.validateRule(req.body);
    const { provider, service, network, planCode } = values;
    const rule = await Rule.findOneAndUpdate({ provider, service, network, planCode }, { $set: { ...values, updatedBy: req.user.id } }, { upsert: true, new: true, runValidators: true });
    res.json({ rule });
  } catch (e) { next(e); }
};
