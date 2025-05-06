const validationService = require('../services/validationService');
const dbService = require('../services/dbService');
const walletService = require('../services/walletService');
const vtpassService = require('../services/vtpassService');
const transactionService = require('../services/transactionService');
const { generateRequestId } = require('../utils');
const { handleServiceError } = require('../middleware/errorHandler');


const buyData = async (req, res) => {
  try {
    const { serviceID, billersCode, variation_code, amount, inputPhone } = validationService.validateDataPurchaseInput(req);

    const transactionContact = billersCode;

    const user = await dbService.findUserById(req.user.id);
    const wallet = await dbService.findWalletByUserId(req.user.id);

    walletService.checkWalletForDebit(wallet, amount);

    const VTPASS_URL = process.env.VTPASS_URL;
    const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
    const VTPASS_SECRET_KEY = process.env.VTPASS_SECRET_KEY;


    const request_id = generateRequestId();
     if (!request_id) {
       console.error("Failed to generate unique request ID.");
       return res.status(500).json({ message: "Could not process request ID. Please try again." });
     }

    const apiRequestData = {
      request_id,
      serviceID,
      billersCode,
      variation_code,
      phone: billersCode,
    };

    const vtpassResponseData = await vtpassService.makePayment(
      VTPASS_URL,
      VTPASS_API_KEY,
      VTPASS_SECRET_KEY,
      apiRequestData
    );

    const newTransaction = transactionService.processPaymentApiResponse(
      vtpassResponseData,
      amount,
      user._id,
      request_id,
      serviceID,
      transactionContact
    );

    const result = await transactionService.handlePaymentOutcome(
      newTransaction,
      wallet,
      amount, 
      user._id,
      transactionContact
    );

    res.status(result.status).json({
      message: result.message,
      ...result.transactionDetails && { transaction: result.transactionDetails },
      ...result.newBalance !== undefined && { newBalance: result.newBalance }
    });


  } catch (err) {
    handleServiceError(err, res);
  }
};

module.exports = {
  buyData,
};