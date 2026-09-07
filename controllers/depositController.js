const axios = require('axios');
const { randomUUID } = require('crypto');
const Wallet = require('../model/Wallet');
const User = require('../model/User');
const Transaction = require('../model/Transaction');
const walletService = require('../services/walletService');
const deposits = require('../services/depositService');
const { toKobo } = require('../utils/money');
const respondError = (res, error) => res.status(error.status || 502).json({
  message: error.status ? error.message : 'Payment service unavailable. Check the transaction status before trying again.'
});

const initiate = provider => async (req, res) => {
  try {
    const userId = req.user.id;
    const amountKobo = toKobo(req.body.amount);
    if (amountKobo < 10000) throw Object.assign(new Error('Minimum deposit is ₦100'), { status: 400 });
    const wallet = await Wallet.findOne({ userId });
    const user = await User.findById(userId);
    if (!wallet || !wallet.isActive) throw Object.assign(new Error('Wallet unavailable'), { status: 400 });
    const settings = await require('../model/WalletSettings').findOne();
    if (amountKobo < toKobo(settings?.minDepositAmount || 100) || amountKobo > toKobo(settings?.maxDepositAmount || 1000000)) {
      throw Object.assign(new Error('Amount is outside deposit limits'), { status: 400 });
    }
    const feeKobo = settings?.deductFeesFromDeposits !== false && provider === 'paystack'
      ? toKobo(await walletService.calculatePaystackFee(amountKobo / 100), { allowZero: true }) : 0;
    if (feeKobo >= amountKobo) throw Object.assign(new Error('Deposit must exceed its processing fee'), { status: 400 });
    const reference = `deposit-${randomUUID()}`;
    const tx = await Transaction.create({ walletId: wallet._id, reference, type: 'deposit',
      status: 'pending', paymentMethod: provider, amount: amountKobo / 100,
      originalAmount: amountKobo / 100, amountKobo, creditKobo: amountKobo - feeKobo,
      processingFee: feeKobo / 100 });
    let url;
    if (provider === 'paystack') {
      const response = await axios.post('https://api.paystack.co/transaction/initialize', {
        email: user.email, amount: amountKobo, currency: 'NGN', reference,
        callback_url: `${process.env.CLIENT_URL}/wallet`,
        metadata: { userId, transactionId: String(tx._id) },
      }, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }, timeout: 30000 });
      if (!response.data?.status || response.data.data?.reference !== reference) throw new Error('Invalid checkout response');
      url = response.data.data.authorization_url;
    } else {
      const credentials = Buffer.from(`${process.env.MONNIFY_API_KEY}:${process.env.MONNIFY_SECRET_KEY}`).toString('base64');
      const token = await walletService.authenticateMonnify(credentials);
      const response = await axios.post(`${process.env.MONNIFY_URL}/api/v1/merchant/transactions/init-transaction`, {
        customerEmail: user.email, amount: amountKobo / 100, currencyCode: 'NGN',
        paymentReference: reference, paymentDescription: 'Wallet deposit', contractCode: process.env.MONNIFY_CONTRACT,
        redirectUrl: `${process.env.CLIENT_URL}/wallet`,
      }, { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 });
      if (!response.data?.requestSuccessful) throw new Error('Invalid checkout response');
      url = response.data.responseBody?.checkoutUrl;
      tx.gatewayReference = response.data.responseBody?.transactionReference;
      await tx.save();
    }
    if (!url) throw new Error('Missing checkout URL');
    return res.json({ reference, url, checkoutUrl: url, processingFee: feeKobo / 100,
      creditedAmount: (amountKobo - feeKobo) / 100, message: 'Payment initialized successfully' });
  } catch (error) { return respondError(res, error); }
};

const verifyReference = async (reference, userId) => {
  const tx = await deposits.ownedDeposit(reference, userId);
  if (tx.paymentMethod !== 'paystack') throw Object.assign(new Error('Incorrect payment provider'), { status: 400 });
  const data = await walletService.fetchPaystackTransaction(reference);
  if (data.reference !== reference) throw new Error('Payment reference mismatch');
  if (data.status !== 'success') return { status: data.status, transactionData: data };
  const result = await deposits.settle({ reference, userId, amountKobo: data.amount,
    currency: data.currency, provider: 'paystack', gatewayResponse: data });
  return { status: 'completed', wallet: { balance: result.wallet.balance }, transactionData: data };
};
const verifyPaystackTransaction = async (req, res) => {
  try {
    const reference = req.body?.reference || req.params?.ref;
    const result = await verifyReference(reference, req.user.id);
    return res.status(result.status === 'completed' ? 200 : 202).json({ ...result,
      message: result.status === 'completed' ? 'Transaction successful' : 'Payment has not completed' });
  } catch (error) { return respondError(res, error); }
};
const verifyMonnifyReference = async (reference, userId) => {
  const tx = await deposits.ownedDeposit(reference, userId);
  if (tx.paymentMethod !== 'monnify' || !tx.gatewayReference) throw Object.assign(new Error('Deposit requires reconciliation'), { status: 409 });
  const credentials = Buffer.from(`${process.env.MONNIFY_API_KEY}:${process.env.MONNIFY_SECRET_KEY}`).toString('base64');
  const token = await walletService.authenticateMonnify(credentials);
  const response = await walletService.fetchMonnifyTransaction(encodeURIComponent(tx.gatewayReference), token);
  const data = response.responseBody;
  if (data.paymentReference !== tx.reference) throw new Error('Payment reference mismatch');
  if (data.paymentStatus !== 'PAID') return { status: 'pending', message: 'Payment has not completed' };
  const result = await deposits.settle({ reference: tx.reference, userId,
    amountKobo: toKobo(data.amountPaid), currency: data.currencyCode, provider: 'monnify', gatewayResponse: data });
  return { status: 'paid', message: 'Transaction successful', wallet: { balance: result.wallet.balance } };
};
const verifyMonnifyTransaction = async (req, res) => {
  try {
    const result = await verifyMonnifyReference(req.params.ref, req.user.id);
    return res.status(result.status === 'paid' ? 200 : 202).json(result);
  } catch (error) { return respondError(res, error); }
};
module.exports = { depositWalletWithPaystack: initiate('paystack'), depositWalletWithMonnify: initiate('monnify'),
  depositPaystackWallet: verifyPaystackTransaction, verifyPaystackTransaction, verifyMonnifyTransaction, verifyReference, verifyMonnifyReference };
