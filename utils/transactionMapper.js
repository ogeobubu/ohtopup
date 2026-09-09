function toCustomerUtility(tx) {
  const obj = typeof tx.toJSON === "function" ? tx.toJSON() : { ...tx };

  return {
    id: obj._id,
    reference: obj.requestId,
    serviceID: obj.serviceID,
    type: obj.type,
    status: obj.status,
    product_name: obj.product_name,
    amount: obj.amount,
    phone: obj.phone,
    network: obj.network || null,
    dataPlan: obj.dataPlan || null,
    token: obj.token || null,
    units: obj.units || null,
    validity: obj.validity || null,
    subscription_type: obj.subscription_type || null,
    createdAt: obj.createdAt,
  };
}

function toCustomerUtilityDetail(tx) {
  const base = toCustomerUtility(tx);

  return {
    ...base,
    transactionType: "utility",
  };
}

function toCustomerWallet(tx) {
  return {
    id: tx._id,
    reference: tx.reference,
    type: tx.type,
    status: tx.status,
    amount: tx.amount,
    bankName: tx.bankName || null,
    accountNumber: tx.accountNumber || null,
    paymentMethod: tx.paymentMethod || null,
    createdAt: tx.createdAt,
  };
}

module.exports = {
  toCustomerUtility,
  toCustomerUtilityDetail,
  toCustomerWallet,
};
