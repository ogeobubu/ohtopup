const validationService = require("../services/validationService");
const dbService = require("../services/dbService");
const walletService = require("../services/walletService");
const vtpassService = require("../services/vtpassService");
const transactionService = require("../services/transactionService");
const { generateRequestId } = require("../utils");

const buyAirtime = async (req, res, next) => {
  try {
    const { serviceID, amount, phone } =
      validationService.validateAirtimePurchaseInput(req);

    const user = await dbService.findUserById(req.user.id);
    const wallet = await dbService.findWalletByUserId(req.user.id);

    walletService.checkWalletForDebit(wallet, amount);

    const VTPASS_URL = process.env.VTPASS_URL;
    const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
    const VTPASS_SECRET_KEY = process.env.VTPASS_SECRET_KEY;

    const request_id = generateRequestId();
    if (!request_id) {
      return next({
        status: 500,
        message: "Could not process request ID. Please try again.",
      });
    }

    const apiRequestData = {
      request_id,
      serviceID,
      amount,
      phone,
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
      phone
    );

    const result = await transactionService.handlePaymentOutcome(
      newTransaction,
      wallet,
      amount,
      user._id,
      phone
    );

    res.status(result.status).json({
      message: result.message,
      ...(result.transactionDetails && {
        transaction: result.transactionDetails,
      }),
      ...(result.newBalance !== undefined && { newBalance: result.newBalance }),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  buyAirtime,
};
