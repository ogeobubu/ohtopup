const validationService = require("../services/validationService");
const dbService = require("../services/dbService");
const walletService = require("../services/walletService");
const vtpassService = require("../services/vtpassService");
const transactionService = require("../services/transactionService");
const { Provider } = require("../model/Provider");
const { generateRequestId } = require("../utils");

const purchaseCable = async (req, res, next) => {
  try {
    const {
      serviceID,
      billersCode,
      variation_code,
      amount,
      phone,
      subscription_type,
      transactionPin,
    } = validationService.validateCablePurchaseInput(req);

    const transactionContact = billersCode;

    const user = await dbService.findUserById(req.user.id);
    const wallet = await dbService.findWalletByUserId(req.user.id);

    // Verify transaction PIN
    if (!user.transactionPin) {
      return next({
        status: 400,
        message: "Transaction PIN not set. Please set your transaction PIN in settings.",
      });
    }

    if (user.transactionPin !== transactionPin) {
      return next({
        status: 400,
        message: "Invalid transaction PIN.",
      });
    }

    walletService.checkWalletForDebit(wallet, amount);

    // Get active cable provider
    const provider = await Provider.findOne({
      isActive: true,
      supportedServices: "cable"
    });

    if (!provider) {
      return next({
        status: 503,
        message: "No active cable provider available. Please try again later.",
      });
    }

    const request_id = generateRequestId();
    if (!request_id) {
      return next({
        status: 500,
        message: "Could not process request ID. Please try again.",
      });
    }

    let apiResponse;

    // Route to appropriate provider service
    if (provider.name === 'vtpass') {
      vtpassService.setProvider(provider);

      const apiRequestData = {
        request_id,
        serviceID,
        billersCode,
        variation_code,
        amount,
        phone,
        subscription_type,
      };

      apiResponse = await vtpassService.makePayment(apiRequestData);
    } else {
      return next({
        status: 400,
        message: `Unsupported provider: ${provider.name}`,
      });
    }

    const vtpassResponseData = apiResponse;

    const newTransaction = transactionService.processPaymentApiResponse(
      vtpassResponseData,
      amount,
      user._id,
      request_id,
      serviceID,
      transactionContact,
      { subscription_type: subscription_type }
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
  purchaseCable,
};
