function describeActivity(tx, entries) {
  const utility = tx.transactionType !== 'wallet' && !['deposit', 'withdrawal'].includes(tx.type);
  const reference = tx.reference || tx.requestId;
  const debitKey = `${utility ? 'purchase' : tx.type}:${reference}`;
  const refundKey = `${utility ? 'purchase' : 'withdrawal'}-refund:${reference}`;
  const entry = entries.find(item => item.key === debitKey);
  const refund = tx.type !== 'deposit' && entries.find(item => item.key === refundKey && item.deltaKobo > 0);
  return {
    ...tx,
    walletDirection: entry ? (entry.deltaKobo > 0 ? 'credit' : 'debit') : null,
    walletAmountKobo: entry ? Math.abs(entry.deltaKobo) : null,
    refundStatus: refund ? 'refunded' : null,
    refundedAt: refund ? refund.createdAt : null,
  };
}
module.exports = { describeActivity };
