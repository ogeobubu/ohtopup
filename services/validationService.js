const validateAirtimePurchaseInput = (req) => {
    const { serviceID, amount: amountStr, phone } = req.body;
  
    if (!serviceID || !amountStr || !phone) {
      throw { status: 400, message: "Service ID, amount, and phone number are required." };
    }
  
    const amount = parseFloat(amountStr);
  
    if (isNaN(amount) || amount <= 0) {
      throw { status: 400, message: "Invalid amount specified." };
    }
  
    return { serviceID, amount, phone };
  };
  
  const validateDataPurchaseInput = (req) => {
      const { serviceID, billersCode, variation_code, amount: amountStr, phone } = req.body;
  
      if (!serviceID || !billersCode || !variation_code || !amountStr) {
          throw { status: 400, message: "Service ID, billersCode, variation_code, and amount are required." };
      }
  
      const amount = parseFloat(amountStr);
  
      if (isNaN(amount) || amount <= 0) {
          throw { status: 400, message: "Invalid amount specified." };
      }
  
      return { serviceID, billersCode, variation_code, amount, inputPhone: phone };
  };
  
  
  module.exports = {
    validateAirtimePurchaseInput,
    validateDataPurchaseInput,
  };