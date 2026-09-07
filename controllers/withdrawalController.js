const crypto = require('crypto');
const Wallet = require('../model/Wallet');
const User = require('../model/User');
const Settings = require('../model/WalletSettings');
const Transaction = require('../model/Transaction');
const accounting = require('../services/accountingService');
const withdrawals = require('../services/withdrawalService');
const { toKobo } = require('../utils/money');
const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
const request = async (req, res, next) => {
  try {
    const amountKobo = toKobo(req.body.amount);
    const user = await User.findById(req.user.id);
    if (!user || !await require('../services/pinService').verify(user._id, req.body.transactionPin)) fail('Invalid transaction PIN');
    const { bankName, bankCode, accountNumber } = req.body;
    if (typeof bankCode !== 'string' || !/^\d{3,10}$/.test(bankCode) || typeof accountNumber !== 'string' || !/^\d{10}$/.test(accountNumber)) fail('Invalid bank details');
    const settings = await Settings.findOne();
    if (amountKobo < toKobo(settings?.minWithdrawalAmount || 100) || amountKobo > toKobo(settings?.maxWithdrawalAmount || 500000)) fail('Amount is outside withdrawal limits');
    let feeKobo = 0;
    if (settings?.deductFeesFromWithdrawals) {
      const { percentage = 1, fixedFee = 50, cap = 500 } = settings.withdrawalFee || {};
      feeKobo = toKobo(Math.round(Math.min(cap, fixedFee + amountKobo / 100 * percentage / 100) * 100) / 100, { allowZero: true });
    }
    const method = req.body.feeDeductionMethod || 'fromWallet';
    if (!['fromWallet', 'fromWithdrawal'].includes(method)) fail('Invalid fee deduction method');
    const payout = amountKobo - (method === 'fromWithdrawal' ? feeKobo : 0);
    if (payout <= 0) fail('Withdrawal must exceed its fee');
    const debitKobo = amountKobo + (method === 'fromWallet' ? feeKobo : 0);
    const key = req.headers['idempotency-key'] || crypto.randomUUID();
    if (typeof key !== 'string' || !/^[\w-]{8,100}$/.test(key)) fail('Invalid withdrawal key');
    const reference = 'withdrawal-' + crypto.createHash('sha256').update(`${req.user.id}:${key}`).digest('hex');
    const result = await accounting.transact(async session => {
      const wallet = await Wallet.findOne({ userId: req.user.id }).session(session);
      if (!wallet) fail('Wallet not found');
      const existing = await Transaction.findOne({ reference }).session(session);
      if (existing) {
        if (existing.amountKobo !== payout || existing.totalDebited !== debitKobo / 100 || existing.accountNumber !== accountNumber || existing.bankCode !== bankCode) fail('Withdrawal key already used');
        return { wallet, transaction: existing };
      }
      const updated = await accounting.move({ walletId: wallet._id, deltaKobo: -debitKobo,
        key: `withdrawal:${reference}`, reason: 'Withdrawal request', session });
      const [transaction] = await Transaction.create([{ reference, walletId: wallet._id, amount: payout / 100,
        amountKobo: payout, type: 'withdrawal', status: 'pending', paymentMethod: 'naira_wallet',
        bankName, bankCode, accountNumber, originalAmount: amountKobo / 100, feeAmount: feeKobo / 100,
        totalDebited: debitKobo / 100, feeDeductionMethod: method }], { session });
      return { wallet: updated, transaction };
    });
    res.json({ message: 'Withdrawal request submitted for admin approval.', wallet: { balance: result.wallet.balance }, transaction: result.transaction });
  } catch (error) { next(error); }
};
const transition = (status, allowed, refund = false) => async (req, res, next) => {
  try {
    if (status === 'processing' && !req.body.gatewayReference) fail('A bank transfer reference is required');
    if (refund && !req.body.reason) fail('A reason is required');
    const tx = await withdrawals.transition({ id: req.params.id, status, allowed, refund,
      adminId: req.user.id, reason: req.body.reason, gatewayReference: req.body.gatewayReference });
    res.json({ message: `Withdrawal ${status}`, withdrawal: tx });
  } catch (error) { next(error); }
};
module.exports = { request, approveWithdrawal: transition('approved', ['pending']),
  rejectWithdrawal: transition('rejected', ['pending', 'approved'], true),
  processWithdrawal: transition('processing', ['approved']), completeWithdrawal: transition('completed', ['processing']),
  failWithdrawal: transition('failed', ['processing'], true),
  retryWithdrawal: (req, res) => res.status(409).json({ message: 'Create a new withdrawal after confirming the original was refunded. Automatic retries are unavailable.' }),
};
