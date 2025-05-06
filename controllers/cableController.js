const validationService = require('../services/validationService');
const dbService = require('../services/dbService');
const walletService = require('../services/walletService');
const vtpassService = require('../services/vtpassService');
const transactionService = require('../services/transactionService');
const { generateRequestId } = require('../utils');
const { handleServiceError } = require('../middleware/errorHandler');


const purchaseCable = async (req, res) => {
  try {
    // 1. Validate Input (uses cable-specific validation)
    const { serviceID, billersCode, variation_code, amount, phone, subscription_type } = validationService.validateCablePurchaseInput(req);

    // For Cable, the transaction contact in our DB/notification is billersCode (based on original code logic)
    const transactionContact = billersCode;

    // 2. Fetch User and Wallet (reusable)
    const user = await dbService.findUserById(req.user.id);
    const wallet = await dbService.findWalletByUserId(req.user.id);

    // 3. Perform Wallet Checks (reusable)
    walletService.checkWalletForDebit(wallet, amount);

    // 4. Get and Check Environment Variables
    const VTPASS_URL = process.env.VTPASS_URL;
    const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
    const VTPASS_SECRET_KEY = process.env.VTPASS_SECRET_KEY;


    // 5. Generate Request ID
    const request_id = generateRequestId();
     if (!request_id) {
       console.error("Failed to generate unique request ID.");
       return res.status(500).json({ message: "Could not process request ID. Please try again." });
     }

    // 6. Prepare specific API Data payload for Cable purchase
    // Based on the original code, cable payload includes serviceID, billersCode, variation_code, amount, phone, and subscription_type
    const apiRequestData = {
      request_id,
      serviceID,
      billersCode,
      variation_code,
      amount, // Include amount as in original code
      phone,  // Include phone as in original code
      subscription_type, // Include subscription_type
    };

    // 7. Make API Call (reusable service)
    const vtpassResponseData = await vtpassService.makePayment(
      VTPASS_URL,
      VTPASS_API_KEY,
      VTPASS_SECRET_KEY,
      apiRequestData
    );

    // 8. Process API Response and Create Transaction Model (reusable service, pass response data, contact, and optional fields)
    // Pass subscription_type in the optionalFields object
    const newTransaction = transactionService.processPaymentApiResponse(
      vtpassResponseData,
      amount,
      user._id,
      request_id,
      serviceID,
      transactionContact, // Pass billersCode as the contact value
      { subscription_type: subscription_type } // Pass optional fields object including subscription_type
    );

    // 9. Handle Transaction Outcome (Save DB, Debit Wallet, Notify) (reusable service, pass contact)
    const result = await transactionService.handlePaymentOutcome(
      newTransaction,
      wallet,
      amount,
      user._id,
      transactionContact // Pass billersCode as the contact value
    );

    // 10. Send Final Response
    res.status(result.status).json({
      message: result.message,
      ...result.transactionDetails && { transaction: result.transactionDetails },
      ...result.newBalance !== undefined && { newBalance: result.newBalance }
    });


  } catch (err) {
    // 11. Delegate error handling to the centralized handler
    handleServiceError(err, res);
  }
};

module.exports = {
  purchaseCable,
};