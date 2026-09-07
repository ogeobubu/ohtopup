const { toKobo } = require('../utils/money');
const validateAirtimePurchaseInput = (req) => {
   const { serviceID, amount: amountStr, phone, provider, transactionPin } = req.body;

   if (!serviceID || !amountStr || !phone) {
     throw { status: 400, message: "Service ID, amount, and phone number are required." };
   }

   if (!transactionPin) {
     throw { status: 400, message: "Transaction PIN is required." };
   }

   const amount = toKobo(amountStr) / 100;

   if (isNaN(amount) || amount <= 0) {
     throw { status: 400, message: "Invalid amount specified." };
   }

   return { serviceID, amount, phone, provider, transactionPin };
};

const validateDataPurchaseInput = (req) => {
    const { serviceID, billersCode, variation_code, amount: amountStr, phone, provider, transactionPin } = req.body;

    if (!serviceID || !billersCode || !variation_code || !amountStr) {
        throw { status: 400, message: "Service ID, billersCode, variation_code, and amount are required." };
    }

    if (!transactionPin) {
        throw { status: 400, message: "Transaction PIN is required." };
    }

    const amount = toKobo(amountStr) / 100;

    if (isNaN(amount) || amount <= 0) {
        throw { status: 400, message: "Invalid amount specified." };
    }

    return { serviceID, billersCode, variation_code, amount, inputPhone: phone, provider, transactionPin };
};

const validateElectricityPurchaseInput = (req) => {
     const { serviceID, billersCode, variation_code, amount: amountStr, phone, provider, transactionPin } = req.body;

     if (!serviceID || !billersCode || !variation_code || !amountStr || !phone) {
         throw { status: 400, message: "Service ID, billersCode, variation_code, amount, and phone are required." };
     }

     if (!transactionPin) {
         throw { status: 400, message: "Transaction PIN is required." };
     }

      const amount = toKobo(amountStr) / 100;

     if (isNaN(amount) || amount <= 0) {
         throw { status: 400, message: "Invalid amount specified." };
     }

     return { serviceID, billersCode, variation_code, amount, phone, provider, transactionPin };
};

const validateCablePurchaseInput = (req) => {
   const { serviceID, billersCode, variation_code, amount: amountStr, phone, subscription_type, provider, transactionPin } = req.body;


    if (!serviceID || !billersCode || (subscription_type === "change" && !variation_code) || !amountStr || !phone || !["renew", "change"].includes(subscription_type)) {
       throw { status: 400, message: "Service ID, billersCode, variation_code, amount, phone, and subscription_type are required." };
   }

   if (!transactionPin) {
       throw { status: 400, message: "Transaction PIN is required." };
   }

    const amount = toKobo(amountStr) / 100;

   if (isNaN(amount) || amount <= 0) {
       throw { status: 400, message: "Invalid amount specified." };
   }

   return { serviceID, billersCode, variation_code, amount, phone, subscription_type, provider, transactionPin };
};


module.exports = {
  validateAirtimePurchaseInput,
  validateDataPurchaseInput,
  validateElectricityPurchaseInput,
  validateCablePurchaseInput
};