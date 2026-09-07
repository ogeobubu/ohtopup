const Transaction = require('../model/Transaction');
const Wallet = require('../model/Wallet');
const Audit = require('../model/WithdrawalAuditLog');
const accounting = require('./accountingService');
const { toKobo } = require('../utils/money');

const transition = async ({ id, reference, allowed, status, refund = false, adminId, reason, gatewayReference, gatewayResponse }) => accounting.transact(async session => {
  const tx = await Transaction.findOne({ ...(id ? { _id: id } : { reference }), type: 'withdrawal' }).session(session);
  if (!tx) throw Object.assign(new Error('Withdrawal not found'), { status: 404 });
  if (tx.status === status && (!refund || tx.refundedAt)) return tx;
  if (!allowed.includes(tx.status)) throw Object.assign(new Error('Withdrawal status changed; refresh before continuing'), { status: 409 });
  const oldStatus = tx.status;
  const wallet = await Wallet.findById(tx.walletId).session(session);
  if (refund && !tx.refundedAt) {
    // Never guess a historical debit that lacks an accounting record.
    const debit = await require('../model/WalletEntry').findOne({ key: `withdrawal:${tx.reference}` }).session(session);
    if (!debit) throw Object.assign(new Error('Legacy withdrawal requires reconciliation'), { status: 409 });
    await accounting.move({ walletId: tx.walletId, deltaKobo: -debit.deltaKobo,
      key: `withdrawal-refund:${tx.reference}`, reason: reason || 'Withdrawal refund', session });
    tx.refundedAt = new Date();
  }
  tx.status = status;
  if (adminId) tx.adminId = adminId;
  if (gatewayReference) tx.gatewayReference = gatewayReference;
  if (gatewayResponse) tx.gatewayResponse = gatewayResponse;
  if (status === 'completed') tx.completedAt = new Date();
  if (status === 'processing') tx.processingStartedAt = new Date();
  if (status === 'rejected') tx.rejectionReason = reason;
  if (status === 'failed') tx.failureReason = reason;
  await tx.save({ session });
  if (adminId) await Audit.create([{ transactionId: tx._id, adminId, userId: wallet.userId,
    oldStatus, newStatus: status, action: { approved: 'approve', rejected: 'reject', processing: 'process', completed: 'complete', failed: 'fail' }[status],
    reason, amount: tx.amount, gatewayReference: tx.gatewayReference }], { session });
  return tx;
});
module.exports = { transition };
