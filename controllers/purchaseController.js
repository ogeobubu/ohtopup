const crypto = require('crypto');
const { Provider, NetworkProvider } = require('../model/Provider');
const User = require('../model/User');
const Wallet = require('../model/Wallet');
const SelectedPlan = require('../model/SelectedDataPlan');
const Variation = require('../model/Variation');
const AirtimeSettings = require('../model/AirtimeSettings');
const validation = require('../services/validationService');
const purchases = require('../services/purchaseService');
const { toKobo } = require('../utils/money');
const validators = { airtime: 'validateAirtimePurchaseInput', data: 'validateDataPurchaseInput', cable: 'validateCablePurchaseInput', electricity: 'validateElectricityPurchaseInput' };
const networkCodes = { mtn: '01', glo: '02', airtel: '04', '9mobile': '03' };
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const makeAdapter = provider => {
  const base = provider.name === 'vtpass' ? require('../services/vtpassService') : require('../services/clubkonnectService');
  const adapter = new base.constructor();
  adapter.setProvider(provider);
  return adapter;
};
const buy = type => async (req, res, next) => {
  let reservation;
  try {
    const input = validation[validators[type]](req);
    const user = await User.findById(req.user.id);
    if (!user || !await require('../services/pinService').verify(user._id, input.transactionPin)) fail('Invalid transaction PIN');
    const filter = { isActive: true, supportedServices: type };
    if (input.provider) filter.name = input.provider;
    const provider = await Provider.findOne(filter).sort({ isDefault: -1 });
    if (!provider || !['vtpass', 'clubkonnect'].includes(provider.name)) fail('No active provider available', 503);
    if (provider.name === 'clubkonnect' && !['airtime', 'data'].includes(type)) fail('Unsupported provider', 400);
    const adapter = makeAdapter(provider);
    let amount = input.amount;
    let serviceID = input.serviceID;
    let network;
    let plan;
    let providerPlanId;
    if (type === 'data') {
      plan = await SelectedPlan.findOne({ provider: provider._id, planId: input.variation_code, isActive: true, isVisible: true });
      if (plan) {
        amount = plan.adminPrice ?? plan.amount;
        serviceID = plan.serviceId;
        network = plan.network.toLowerCase();
      } else if (provider.name === 'vtpass') {
        plan = await Variation.findOne({ serviceID, variation_code: input.variation_code, isActive: true });
        if (!plan) fail('Selected data plan is unavailable');
        amount = Number(plan.variation_amount);
      } else fail('Selected data plan is unavailable');
    }
    if (type === 'data' && provider.name === 'clubkonnect') {
      const catalog = await adapter.getDataPlans();
      const current = catalog.plans?.find(p => String(p.productCode) === String(plan.planId) &&
        String(p.networkId) === networkCodes[network]);
      if (!catalog.success || !current?.productId) fail('Unable to verify the selected data plan', 503);
      providerPlanId = current.productId;
    }
    if (type === 'cable' && input.subscription_type === 'renew') {
      const response = await require('axios').post(`${adapter.baseUrl}/api/merchant-verify`, {
        billersCode: input.billersCode, serviceID,
      }, { headers: { 'api-key': adapter.apiKey, 'secret-key': adapter.secretKey }, timeout: 30000 });
      const customer = response.data?.content;
      if (String(response.data?.code) !== '000' || !customer?.Renewal_Amount) fail('Unable to verify renewal amount', 503);
      amount = Number(customer.Renewal_Amount);
    }
    if (type === 'cable' && input.subscription_type === 'change') {
      const catalog = await adapter.getServiceVariations(serviceID);
      const plan = catalog.variations?.find(p => p.variation_code === input.variation_code);
      if (!catalog.success || !plan || input.subscription_type !== 'change') {
        fail('Select a current cable plan using the change subscription option');
      }
      amount = Number(plan.variation_amount);
    }
    if (['airtime', 'data'].includes(type)) {
      if (!network) {
        const configured = await NetworkProvider.findOne({ provider: provider._id, serviceId: serviceID, serviceType: type, isActive: true });
        network = configured?.name?.toLowerCase() || serviceID.replace('-data', '').replace('etisalat', '9mobile');
      }
      if (!networkCodes[network]) fail('Invalid network');
      if (provider.name === 'vtpass') serviceID = `${network === '9mobile' ? 'etisalat' : network}${type === 'data' ? '-data' : ''}`;
    }
    // Reject stale or tampered prices; the customer must confirm the current quote.
    if (toKobo(input.amount) !== toKobo(amount)) fail('Price changed. Refresh the plan and confirm the new price.', 409);
    let commissionRate = 0;
    if (type === 'airtime') await require('./airtimeController').validatePurchaseLimits(amount, input.phone, user._id);
    if (['airtime', 'data'].includes(type)) {
      const settings = await AirtimeSettings.find({ isActive: true });
      const local = settings.find(s => s.type === 'network' && s.network === network);
      const global = settings.find(s => s.type === 'global');
      commissionRate = local?.settings?.[`${type}CommissionRate`] ?? global?.settings?.[`${type}CommissionRate`] ?? 0;
    }
    if (type === 'electricity') {
      const disco = { 'ikeja-electric': 'ikeja', 'eko-electric': 'eko', 'abuja-electric': 'abuja', 'ibadan-electric': 'ibadan', 'enugu-electric': 'enugu', 'portharcourt-electric': 'port', 'kano-electric': 'kano', 'jos-electric': 'jos', 'kaduna-electric': 'kaduna', 'benin-electric': 'benin', 'yola-electric': 'yola' }[serviceID];
      if (!disco) fail('Invalid electricity provider');
      const settings = require('../services/electricitySettingsService');
      const limits = await settings.getAmountLimits(disco);
      if (!limits.success) fail('Unable to load purchase limits', 503);
      if (amount < limits.minAmount || amount > limits.maxAmount) fail('Amount is outside the permitted purchase limits');
      const commission = await settings.getCommissionRate(disco);
      commissionRate = commission.success ? commission.commissionRate : 0;
    }
    if (!Number.isFinite(Number(commissionRate)) || commissionRate < 0 || commissionRate >= 100) fail('Invalid pricing configuration', 503);
    const cost = Math.round(toKobo(amount) * (1 - commissionRate / 100)) / 100;
    const contact = input.billersCode || input.phone;
    const key = req.headers['idempotency-key'] || crypto.randomUUID();
    if (typeof key !== 'string' || !/^[\w-]{8,100}$/.test(key)) fail('Invalid purchase key');
    const identity = { type, provider: String(provider._id), serviceID, contact, amount, variation: input.variation_code, phone: input.phone || input.inputPhone, subscription: input.subscription_type };
    reservation = await purchases.begin({ userId: user._id, key, fingerprint: purchases.fingerprint(identity), amount, cost,
      serviceID, contact, type, provider: provider.name, providerId: provider._id,
      details: { network, variation_code: input.variation_code, subscription_type: input.subscription_type, dataPlan: input.variation_code } });
    let transaction = reservation.transaction;
    if (!reservation.duplicate) {
      let response;
      try {
        if (provider.name === 'vtpass') {
          response = await adapter.makePayment({ request_id: transaction.requestId, serviceID, amount,
            phone: input.phone || input.inputPhone || contact,
            ...(type !== 'airtime' && { billersCode: contact, variation_code: input.variation_code }),
            ...(input.subscription_type && { subscription_type: input.subscription_type }),
          });
        } else if (type === 'airtime') {
          response = await adapter.purchaseAirtime(networkCodes[network], amount, contact, transaction.requestId);
        } else {
          response = await adapter.purchaseData(networkCodes[network], providerPlanId, contact, transaction.requestId);
        }
      } catch {
        // A timeout does not prove non-delivery. Keep the persisted debit pending for reconciliation.
        response = {};
      }
      transaction = await purchases.finish(transaction.requestId, response);
    }
    const wallet = await Wallet.findOne({ userId: user._id });
    const status = transaction.status;
    return res.status(status === 'delivered' ? 201 : status === 'failed' ? 400 : 202).json({
      message: status === 'delivered' ? 'Purchase successful' : status === 'failed' ? 'Purchase failed; your wallet has been refunded.' : 'Purchase is being checked. Please do not buy again yet.',
      transaction: { requestId: transaction.requestId, status, amount: transaction.amount, product_name: transaction.product_name, token: transaction.token, units: transaction.units },
      newBalance: wallet.balance,
    });
  } catch (error) {
    if (reservation) return res.status(202).json({ message: 'Purchase is being checked. Please do not buy again yet.', transaction: { requestId: reservation.transaction.requestId, status: 'pending' } });
    return next(error);
  }
};
module.exports = { buy, makeAdapter };
