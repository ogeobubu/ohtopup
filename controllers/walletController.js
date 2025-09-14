// walletController.js
require("dotenv").config()
const crypto = require('crypto');
const Wallet = require("../model/Wallet");
const User = require("../model/User");
const Transaction = require("../model/Transaction");
const WalletSettings = require("../model/WalletSettings");
const WithdrawalAuditLog = require("../model/WithdrawalAuditLog");
const axios = require("axios");
const { handleServiceError } = require("../middleware/errorHandler");

const walletService = require("../services/walletService");
const dbService = require("../services/dbService");

const {
  sendTransactionEmailNotification,
} = require("../controllers/email/sendTransactionEmailNotification");

const createWallet = async (req, res) => {
  const { userId } = req.body;
  try {
    const wallet = new Wallet({ userId });
    await wallet.save();
    res.status(201).json(wallet);
  } catch (error) {
    console.error("Error creating wallet:", error);
    res.status(500).json({ message: "Error creating wallet", error });
  }
};

const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    // Try to find existing wallet
    let wallet;
    try {
      wallet = await dbService.findWalletByUserId(userId);
    } catch (walletError) {
      // If wallet doesn't exist, create one
      if (walletError.status === 404) {
        console.log(`Creating wallet for user ${userId}`);
        wallet = new Wallet({ userId });
        await wallet.save();
      } else {
        throw walletError;
      }
    }

    try {
      walletService.checkWalletForDebit(wallet, 0);
    } catch (serviceError) {
      if (serviceError.status === 400) {
        return res.status(404).json({ message: serviceError.message });
      }
      throw serviceError;
    }

    res.json(wallet);
  } catch (error) {
    console.error("Error fetching wallet:", error);
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: "Error fetching wallet", error });
  }
};

const getWallets = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const wallets = await Wallet.find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("userId", "username email")
      .exec();

    const walletsToDelete = [];
    const walletDetails = await Promise.all(
      wallets.map(async (wallet) => {
        if (!wallet.userId || !wallet.userId.username || !wallet.userId.email) {
          walletsToDelete.push(wallet._id);
          return null;
        }
        return {
          _id: wallet._id,
          userId: wallet.userId._id,
          username: wallet.userId.username,
          email: wallet.userId.email,
          balance: wallet.balance,
          transactions: wallet.transactions,
          isActive: wallet.isActive,
        };
      })
    );

    if (walletsToDelete.length > 0) {
      console.log(
        `Deleting ${walletsToDelete.length} wallets with missing users.`
      );
      await Wallet.deleteMany({ _id: { $in: walletsToDelete } });
    }

    const totalCount = await Wallet.countDocuments({});
    const totalPages = Math.ceil(totalCount / limit);

    const totalBalance = await Wallet.aggregate([
      { $group: { _id: null, total: { $sum: "$balance" } } },
    ]);
    const totalWalletAmount =
      totalBalance.length > 0 ? totalBalance[0].total : 0;

    res.json({
      currentPage: page,
      totalPages: totalPages,
      totalWallets: totalCount,
      totalWalletAmount: totalWalletAmount,
      wallets: walletDetails.filter(Boolean),
    });
  } catch (error) {
    console.error("Error fetching wallets:", error);
    res.status(500).json({ message: "Error fetching wallets", error });
  }
};

const depositWallet = async (req, res) => {
  const { userId, amount } = req.body;
  let transaction = null;

  try {
    const wallet = await dbService.findWalletByUserId(userId);

    // CORRECTED: Pass arguments individually
    transaction = await walletService.recordTransaction(
      wallet._id, // walletId
      `txn_${Date.now()}_${userId}`, // reference
      amount, // amount
      "deposit", // type
      "pending", // status
      "naira_wallet" // paymentMethod
    );

    await walletService.creditWallet(wallet, amount);

    wallet.transactions.push(transaction._id);
    await wallet.save();

    const completedTransaction = await walletService.updateTransactionStatus(
      transaction.reference,
      "completed"
    );
    transaction.status = "completed";

    const user = await dbService.findUserById(userId);

    // Send email asynchronously to prevent transaction delays
    sendTransactionEmailNotification(user.email, user.username, {
      type: completedTransaction.type,
      product_name: "Wallet Deposit",
      status: completedTransaction.status,
      amount: completedTransaction.amount,
      balance: wallet.balance,
      reference: completedTransaction.reference,
    }).catch(error => {
      console.error('Async wallet deposit email failed:', error.message);
    });

    res.json(wallet);
  } catch (error) {
    if (transaction && transaction.status === "pending") {
      try {
        await walletService.updateTransactionStatus(
          transaction.reference,
          "failed"
        );
      } catch (updateError) {
        console.error(
          "Failed to mark transaction as failed after deposit error:",
          updateError
        );
      }
    }
    console.error("Error depositing to wallet:", error);
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: "Error depositing to wallet", error });
  }
};

const depositPaystackWallet = async (req, res) => {
  const { userId, amount: rawAmount, reference, callbackUrl } = req.body;

  const amount = Number(rawAmount);

  if (isNaN(amount) || amount <= 0) {
    return res
      .status(400)
      .json({ message: "Amount must be a positive number." });
  }
  if (amount < 100) {
    return res.status(400).json({ message: "Amount must be at least 100." });
  }

  try {
    const wallet = await dbService.findWalletByUserId(userId);

    const existingCompletedTx =
      await walletService.findCompletedTransactionByReference(reference);
    if (existingCompletedTx) {
      return res
        .status(400)
        .json({
          message: "Transaction with this reference already completed.",
        });
    }

    // Calculate Paystack processing fee
    const processingFee = await walletService.calculatePaystackFee(amount);
    const creditedAmount = amount - processingFee;

    // CORRECTED: Pass arguments individually
    const transaction = await walletService.recordTransaction(
      wallet._id, // walletId
      reference, // reference
      creditedAmount, // amount
      "deposit", // type
      "completed", // status
      "paystack", // paymentMethod
      {
        processingFee: processingFee,
        originalAmount: amount
      } // details
    );

    await walletService.creditWallet(wallet, creditedAmount);

    wallet.transactions.push(transaction._id);
    await wallet.save();

    await walletService.handleReferralDepositReward(userId, amount);

    const user = await dbService.findUserById(userId);

    // Send email asynchronously to prevent transaction delays
    sendTransactionEmailNotification(user.email, user.username, {
      type: transaction.type,
      product_name: "Paystack Deposit",
      status: transaction.status,
      amount: transaction.amount,
      balance: wallet.balance,
      reference: transaction.reference,
      processingFee: processingFee,
      originalAmount: amount,
    }).catch(error => {
      console.error('Async Paystack deposit email failed:', error.message);
    });

    res.json(wallet);
  } catch (error) {
    console.error("Error processing confirmed Paystack deposit:", error);
    try {
      const tx = await walletService.findTransactionByReference(reference);
      if (tx && tx.status !== "completed") {
        await walletService.updateTransactionStatus(reference, "failed");
      }
    } catch (updateError) {
      console.error(
        "Failed to mark Paystack confirmed transaction as failed:",
        updateError
      );
    }
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    res
      .status(500)
      .json({
        message: "Error processing confirmed Paystack deposit.",
        error: error.message || error,
      });
  }
};

const depositWalletWithPaystack = async (req, res) => {
  const { userId, amount, paymentMethod, email, callbackUrl } = req.body;

  // Input validation
  if (!userId || !amount || !email) {
    console.error("Missing required fields for Paystack deposit:", { userId, amount, email });
    return res.status(400).json({
      message: "Missing required fields: userId, amount, email"
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(`Invalid email format for Paystack deposit: ${email}`);
    return res.status(400).json({
      message: "Invalid email format"
    });
  }

  if (amount < 100) {
    console.error(`Invalid amount for Paystack deposit: ${amount}`);
    return res.status(400).json({
      message: "Amount must be at least ₦100"
    });
  }

  // Ensure amount is a valid number
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    console.error(`Invalid amount value for Paystack deposit: ${amount}`);
    return res.status(400).json({
      message: "Amount must be a valid positive number"
    });
  }

  let transaction = null;
  try {
    console.log(`Initiating Paystack deposit for user ${userId}, amount: ₦${amount}`);

    const wallet = await dbService.findWalletByUserId(userId);
    if (!wallet) {
      console.error(`Wallet not found for user ${userId}`);
      return res.status(404).json({ message: "User wallet not found" });
    }

    const totalAmount = amount * 100;

    transaction = await walletService.recordTransaction(
      wallet._id,
      `txn_${Date.now()}_${userId}`, // temporary reference for tracking
      amount,
      "deposit",
      "pending",
      paymentMethod || "paystack"
    );

    console.log(`Transaction recorded with temp reference: txn_${Date.now()}_${userId}`);

    const paymentData = {
      email,
      amount: totalAmount,
      currency: "NGN",
      // Let Paystack generate the reference
      callback_url: callbackUrl || `${process.env.CLIENT_URL}/wallet`,
      metadata: {
        userId: userId,
        walletId: wallet._id.toString(),
        transactionId: transaction._id.toString(),
        isMobile: req.headers['x-mobile-app'] === 'true' ||
                  req.headers['user-agent']?.includes('Expo') ||
                  req.headers['user-agent']?.includes('React Native') ||
                  false
      }
    };

    console.log("Sending payment data to Paystack:", {
      email: paymentData.email,
      amount: paymentData.amount,
      reference: paymentData.reference
    });

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000 // 30 second timeout
      }
    );

    // Check for Paystack API errors
    if (!response.data || !response.data.status) {
      console.error("Paystack API error:", response.data);

      // Mark transaction as failed
      if (transaction) {
        await walletService.updateTransactionStatus(transaction.reference, "failed");
        console.log(`Transaction ${transaction.reference} marked as failed due to Paystack API error`);
      }

      return res.status(500).json({
        message: "Paystack initialization failed",
        error: response.data?.message || "Unknown Paystack error",
        details: response.data
      });
    }

    // Check for specific "Invalid transaction parameters" error
    if (response.data.message && response.data.message.includes("Invalid transaction parameters")) {
      console.error("Paystack invalid transaction parameters:", {
        paymentData,
        response: response.data
      });

      // Mark transaction as failed
      if (transaction) {
        await walletService.updateTransactionStatus(transaction.reference, "failed");
        console.log(`Transaction ${transaction.reference} marked as failed due to invalid parameters`);
      }

      return res.status(400).json({
        message: "Invalid transaction parameters",
        error: "Please check your payment details and try again",
        details: {
          amount: paymentData.amount,
          email: paymentData.email,
          reference: paymentData.reference
        }
      });
    }

    if (
      !response.data.data ||
      !response.data.data.authorization_url
    ) {
      console.error("Invalid Paystack response structure:", response.data);

      // Mark transaction as failed
      if (transaction) {
        await walletService.updateTransactionStatus(transaction.reference, "failed");
        console.log(`Transaction ${transaction.reference} marked as failed due to invalid response structure`);
      }

      return res.status(500).json({
        message: "Paystack initialization failed",
        error: response.data?.message || "Invalid response structure from Paystack",
      });
    }

    // Get Paystack's generated reference
    const paystackReference = response.data.data.reference;
    console.log('Paystack generated reference:', paystackReference);

    // Store transaction with Paystack's reference
    transaction.reference = paystackReference;
    await transaction.save();

    // Update wallet transactions array
    wallet.transactions.push(transaction._id);
    await wallet.save();

    console.log(`Payment initialized with Paystack reference: ${paystackReference}`);

    res.json({
      reference: paystackReference, // Return Paystack's reference
      url: response.data.data.authorization_url,
      message: "Payment initialized successfully"
    });

  } catch (error) {
    console.error("Error initiating deposit with Paystack:", {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      userId,
      amount
    });

    // Mark transaction as failed if it was created
    if (transaction) {
      try {
        await walletService.updateTransactionStatus(transaction.reference, "failed");
        console.log(`Transaction ${transaction.reference} marked as failed due to error`);
      } catch (updateError) {
        console.error("Failed to update transaction status:", updateError);
      }
    }

    if (error.response?.status) {
      return res.status(error.response.status).json({
        message: error.response.data?.message || "Paystack service error",
        error: error.response.data
      });
    }

    res.status(500).json({
      message: "Error initiating deposit with Paystack",
      error: error.message || "Internal Server Error",
    });
  }
};

const depositWalletWithMonnify = async (req, res) => {
  const { userId, actualAmount, amount, email } = req.body;

  try {
    const wallet = await dbService.findWalletByUserId(userId);

    const transactionReference = `txn_${Date.now()}_${userId}`;
    const totalAmount = amount;

    const paymentData = {
      customerEmail: email,
      amount: totalAmount,
      currencyCode: "NGN",
      paymentReference: transactionReference,
      paymentDescription: "Deposit Payment",
      contractCode: process.env.MONNIFY_CONTRACT,
      callback_url: `${process.env.BASE_URL}/api/wallet/deposit/monnify/verify/${transactionReference}?userId=${userId}`,
      paymentMethod: "CARD",
    };

    const apiKey = process.env.MONNIFY_API_KEY;
    const clientSecret = process.env.MONNIFY_SECRET_KEY;
    const base64Credentials = Buffer.from(`${apiKey}:${clientSecret}`).toString(
      "base64"
    );

    const response = await axios.post(
      `${process.env.MONNIFY_URL}/api/v1/merchant/transactions/init-transaction`,
      paymentData,
      {
        headers: {
          Authorization: `Basic ${base64Credentials}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (
      !response.data ||
      !response.data.requestSuccessful ||
      !response.data.responseBody?.checkoutUrl
    ) {
      console.error("Monnify initialization failed:", response.data);
      const recordedTx = await walletService.findTransactionByReference(
        transactionReference
      );
      if (recordedTx) {
        await walletService.updateTransactionStatus(
          transactionReference,
          "failed"
        );
      } else {
        // CORRECTED: Pass arguments individually
        await walletService.recordTransaction(
          wallet._id, // walletId
          transactionReference, // reference
          actualAmount, // amount (using actualAmount for local record)
          "deposit", // type
          "failed", // status
          paymentData.paymentMethod, // paymentMethod
          { gatewayResponse: response.data } // details
        );
      }

      return res.status(500).json({
        message: "Monnify initialization failed",
        error:
          response.data?.responseMessage || "Invalid response from Monnify",
      });
    }

    const monnifyReference =
      response.data.responseBody.transactionReference || transactionReference;
    try {
      const pendingTx = await walletService.findTransactionByReference(
        transactionReference
      );
      if (pendingTx) {
        if (pendingTx.status !== "pending") {
          console.warn(
            `Monnify deposit initiated for transaction ${transactionReference} which was not pending (status: ${pendingTx.status}).`
          );
        }
        if (pendingTx.reference !== monnifyReference) {
          pendingTx.reference = monnifyReference;
          await pendingTx.save();
        }
      } else {
        // CORRECTED: Pass arguments individually
        await walletService.recordTransaction(
          wallet._id, // walletId
          monnifyReference, // reference
          actualAmount, // amount
          "deposit", // type
          "pending", // status
          paymentData.paymentMethod // paymentMethod
        );
      }
    } catch (dbError) {
      console.error(
        "Error recording/updating transaction after Monnify initiation:",
        dbError
      );
    }

    res.json({
      reference: monnifyReference,
      url: response.data.responseBody.checkoutUrl,
    });
  } catch (error) {
    console.error(
      "Error initiating deposit with Monnify:",
      error.response ? error.response.data : error
    );
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({
      message: "Error initiating deposit with Monnify",
      error: error.response ? error.response.data : "Internal Server Error",
    });
  }
};

const verifyMonnifyTransaction = async (req, res) => {
  const { ref } = req.params;
  const { userId } = req.query;
  const encodedRef = encodeURIComponent(ref);

  const apiKey = process.env.MONNIFY_API_KEY;
  const clientSecret = process.env.MONNIFY_SECRET_KEY;
  const base64Credentials = Buffer.from(`${apiKey}:${clientSecret}`).toString(
    "base64"
  );

  let transaction;

  try {
    transaction = await walletService.findTransactionByReference(ref);

    if (!transaction) {
      console.warn(
        `Verification request for unknown transaction reference: ${ref}`
      );
      return res.status(404).json({ message: "Transaction record not found." });
    }

    if (transaction.status === "completed") {
      console.log(
        `Verification request for already completed transaction reference: ${ref}`
      );
      return res
        .status(200)
        .json({
          status: "completed",
          message: "Transaction already completed.",
        });
    }

    const accessToken = await walletService.authenticateMonnify(
      base64Credentials
    );
    const monnifyTransactionData = await walletService.fetchMonnifyTransaction(
      encodedRef,
      accessToken
    );

    const monnifyAmount = monnifyTransactionData.responseBody?.amount;
    const localAmount = transaction.amount;

    const wallet = await Wallet.findById(transaction.walletId); // Direct model find here
    if (!wallet) {
      console.error(
        `Wallet not found for transaction ${ref} (walletId: ${transaction.walletId}) during verification.`
      );
      await walletService.updateTransactionStatus(ref, "failed");
      return res
        .status(500)
        .json({ message: "Associated user wallet not found." });
    }

    if (monnifyTransactionData.responseBody.paymentStatus === "PAID") {
      await walletService.creditWallet(wallet, localAmount);

      const completedTransaction = await walletService.updateTransactionStatus(
        ref,
        "completed"
      );
      transaction.status = "completed";

      await walletService.handleReferralDepositReward(
        wallet.userId,
        localAmount
      );

      const user = await dbService.findUserById(wallet.userId);

      // Send email asynchronously to prevent transaction delays
      sendTransactionEmailNotification(user.email, user.username, {
        type: completedTransaction.type,
        product_name: "Monnify Deposit",
        status: completedTransaction.status,
        amount: completedTransaction.amount,
        balance: wallet.balance,
        reference: completedTransaction.reference,
      }).catch(error => {
        console.error('Async Monnify deposit email failed:', error.message);
      });

      return res.status(200).json({
        status: "paid",
        message: "Transaction successful",
        transactionData: monnifyTransactionData,
      });
    } else if (
      monnifyTransactionData.responseBody.paymentStatus === "PENDING"
    ) {
      await walletService.updateTransactionStatus(ref, "pending");
      transaction.status = "pending";
      return res.status(200).json({
        status: "pending",
        message: "Transaction pending",
        transactionData: monnifyTransactionData,
      });
    } else {
      await walletService.updateTransactionStatus(ref, "failed");
      transaction.status = "failed";
      return res.status(200).json({
        status: "failed",
        message: "Transaction failed",
        transactionData: monnifyTransactionData,
      });
    }
  } catch (error) {
    console.error(
      "Error verifying Monnify transaction:",
      error.response?.data || error
    );
    if (transaction && transaction.status !== "completed") {
      try {
        await walletService.updateTransactionStatus(
          transaction.reference,
          "failed"
        );
        console.log(
          `Transaction ${transaction.reference} marked as failed due to verification error.`
        );
      } catch (updateError) {
        console.error(
          "Failed to mark transaction as failed after verification error:",
          updateError
        );
      }
    }

    res.status(500).json({
      message: error.message || "Internal server error",
      error: error.response?.data || error.message,
    });
  }
};

const handlePaystackCallback = async (req, res) => {
  const { reference, trxref } = req.query;
  const userAgent = req.headers['user-agent'] || '';
  const referrer = req.headers['referer'] || req.headers['referrer'] || '';

  // Enhanced mobile detection - includes Expo web apps
  const isMobileRequest = req.headers['x-mobile-app'] === 'true' ||
                          userAgent.includes('Expo') ||
                          userAgent.includes('React Native') ||
                          referrer.includes('exp://') ||  // Expo development
                          referrer.includes('localhost:8081') || // Expo web app
                          referrer.includes('localhost:8080') || // Common Expo port
                          referrer.includes('localhost:3000') || // Common dev port
                          userAgent.includes('Android') ||
                          userAgent.includes('iPhone') ||
                          userAgent.includes('iPad') ||
                          userAgent.includes('Mobile');

  console.log(`Callback detection:`, {
    userAgent: userAgent.substring(0, 100),
    referrer,
    xMobileApp: req.headers['x-mobile-app'],
    isMobileRequest
  });

  // If we still can't determine mobile status, try to get it from transaction metadata
  let finalIsMobileRequest = isMobileRequest;
  if (!finalIsMobileRequest && reference) {
    try {
      const transaction = await Transaction.findOne({ reference });
      if (transaction?.metadata?.isMobile) {
        finalIsMobileRequest = true;
        console.log('Mobile status detected from transaction metadata');
      }
    } catch (error) {
      console.log('Could not check transaction metadata for mobile status');
    }
  }

  // Helper function to get the correct redirect URL for mobile requests
  const getMobileRedirectUrl = (params = '') => {
    const isExpoWeb = referrer.includes('localhost:8081') ||
                     referrer.includes('localhost:8080') ||
                     referrer.includes('localhost:3000') ||
                     userAgent.includes('Expo');

    const mobileUrl = isExpoWeb
      ? `${process.env.CLIENT_URL}/wallet`
      : (process.env.MOBILE_APP_URL || 'ohtopupmobile://wallet');

    return `${mobileUrl}${params}`;
  };

  console.log(`Paystack callback received: reference=${reference}, trxref=${trxref}, isMobile=${isMobileRequest}`);

  if (!reference) {
    console.error("Paystack callback: Missing reference parameter");

    if (finalIsMobileRequest) {
      return res.redirect(getMobileRedirectUrl('?error=missing_reference'));
    }
    return res.redirect(`${process.env.CLIENT_URL}/wallet?error=missing_reference`);
  }

  try {
    // Verify the transaction with Paystack
    const paystackData = await walletService.fetchPaystackTransaction(reference);

    if (!paystackData) {
      console.error(`Paystack callback: Failed to fetch transaction data for ${reference}`);
      
      if (finalIsMobileRequest) {
        return res.redirect(getMobileRedirectUrl(`?error=verification_failed&reference=${reference}`));
      }
      return res.redirect(`${process.env.CLIENT_URL}/wallet?error=verification_failed`);
    }

    console.log(`Paystack callback: Transaction status - ${paystackData.status}`);

    if (paystackData.status === 'success') {
      // Try to verify and complete the transaction
      try {
        const verifyResponse = await verifyPaystackTransaction({
          body: { reference, userId: null }
        }, {
          status: () => ({ json: () => {} }),
          json: () => {}
        });

        console.log(`Paystack callback: Verification completed for ${reference}`);
        
        if (finalIsMobileRequest) {
          return res.redirect(getMobileRedirectUrl(`?success=true&reference=${reference}&trxref=${trxref || reference}`));
        }
        return res.redirect(`${process.env.CLIENT_URL}/wallet?success=true&reference=${reference}`);
      } catch (verifyError) {
        console.error(`Paystack callback: Verification error for ${reference}:`, verifyError);
        
        if (finalIsMobileRequest) {
          return res.redirect(getMobileRedirectUrl(`?error=verification_error&reference=${reference}&trxref=${trxref || reference}`));
        }
        return res.redirect(`${process.env.CLIENT_URL}/wallet?error=verification_error&reference=${reference}`);
      }
    } else if (paystackData.status === 'failed') {
      console.log(`Paystack callback: Transaction failed - ${reference}`);
      
      if (finalIsMobileRequest) {
        return res.redirect(getMobileRedirectUrl(`?error=payment_failed&reference=${reference}&trxref=${trxref || reference}`));
      }
      return res.redirect(`${process.env.CLIENT_URL}/wallet?error=payment_failed&reference=${reference}`);
    } else {
      console.log(`Paystack callback: Transaction pending - ${reference}`);
      
      if (finalIsMobileRequest) {
        return res.redirect(getMobileRedirectUrl(`?status=pending&reference=${reference}&trxref=${trxref || reference}`));
      }
      return res.redirect(`${process.env.CLIENT_URL}/wallet?status=pending&reference=${reference}`);
    }

  } catch (error) {
    console.error(`Paystack callback: Error processing callback for ${reference}:`, error);
    
    if (finalIsMobileRequest) {
      return res.redirect(getMobileRedirectUrl(`?error=callback_error&reference=${reference}&trxref=${trxref || reference}`));
    }
    return res.redirect(`${process.env.CLIENT_URL}/wallet?error=callback_error&reference=${reference}`);
  }
};

const handlePaystackWebhook = async (req, res) => {
  // Paystack webhook IP addresses for validation
  const paystackIPs = ['52.31.139.75', '52.49.173.169', '52.214.14.220'];
  const clientIP = req.ip || req.connection.remoteAddress;

  // Optional: Validate IP address (remove this check if not needed)
  // if (!paystackIPs.includes(clientIP)) {
  //   console.warn('Webhook received from unauthorized IP:', clientIP);
  //   return res.status(403).send('Unauthorized IP');
  // }

  try {
    // Verify webhook signature (IMPORTANT for security)
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const hash = crypto.createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      console.error('Invalid webhook signature');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body;
    console.log('Paystack webhook received:', {
      event: event.event,
      reference: event.data?.reference,
      amount: event.data?.amount,
      ip: clientIP
    });

    // Return 200 OK immediately to acknowledge receipt
    res.status(200).send('Webhook received');

    // Process the event asynchronously (don't wait for response)
    processWebhookEvent(event).catch(error => {
      console.error('Error processing webhook event:', error);
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent retries for signature validation errors
    res.status(200).send('Webhook received but processing failed');
  }
};

// Process webhook events asynchronously
const processWebhookEvent = async (event) => {
  try {
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event);
        break;

      case 'charge.failed':
        await handleChargeFailed(event);
        break;

      case 'transfer.success':
        await handleTransferSuccess(event);
        break;

      case 'transfer.failed':
        await handleTransferFailed(event);
        break;

      case 'transfer.reversed':
        await handleTransferReversed(event);
        break;

      default:
        console.log('Unhandled webhook event:', event.event);
    }
  } catch (error) {
    console.error('Error in processWebhookEvent:', error);
    throw error;
  }
};

// Handle successful charge
const handleChargeSuccess = async (event) => {
  const { reference, amount, customer, metadata } = event.data;

  console.log(`Processing charge.success for reference: ${reference}`);

  // Find the user by reference or metadata
  let userId = metadata?.userId;
  if (!userId) {
    userId = await findUserByReference(reference);
  }

  if (!userId) {
    console.error('User not found for reference:', reference);
    return;
  }

  // Verify and complete the transaction
  await completeWalletDeposit({
    userId,
    reference,
    amount: amount / 100, // Convert from kobo to naira
    paystackData: event.data
  });

  console.log(`Payment completed via webhook: ${reference} - ₦${amount / 100}`);
};

// Handle failed charge
const handleChargeFailed = async (event) => {
  const { reference, amount, customer, metadata } = event.data;

  console.log(`Processing charge.failed for reference: ${reference}`);

  // Find and mark transaction as failed
  const transaction = await Transaction.findOne({ reference });
  if (transaction && transaction.status === 'pending') {
    transaction.status = 'failed';
    transaction.gatewayResponse = event.data;
    await transaction.save();

    console.log(`Transaction ${reference} marked as failed`);
  }
};

// Handle successful transfer
const handleTransferSuccess = async (event) => {
  const { reference, amount, recipient } = event.data;

  console.log(`Processing transfer.success for reference: ${reference}`);

  // Update withdrawal transaction status
  const transaction = await Transaction.findOne({ reference });
  if (transaction && transaction.type === 'withdrawal') {
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    transaction.gatewayResponse = event.data;
    await transaction.save();

    console.log(`Withdrawal ${reference} marked as completed`);
  }
};

// Handle failed transfer
const handleTransferFailed = async (event) => {
  const { reference, amount, recipient } = event.data;

  console.log(`Processing transfer.failed for reference: ${reference}`);

  // Update withdrawal transaction status and refund wallet
  const transaction = await Transaction.findOne({ reference });
  if (transaction && transaction.type === 'withdrawal' && transaction.status === 'processing') {
    transaction.status = 'failed';
    transaction.failureReason = 'Transfer failed';
    transaction.gatewayResponse = event.data;
    await transaction.save();

    // Refund the amount to wallet
    const wallet = await Wallet.findById(transaction.walletId);
    if (wallet) {
      await walletService.creditWallet(wallet, transaction.amount);
      console.log(`Refunded ₦${transaction.amount} to wallet for failed transfer ${reference}`);
    }
  }
};

// Handle reversed transfer
const handleTransferReversed = async (event) => {
  const { reference, amount, recipient } = event.data;

  console.log(`Processing transfer.reversed for reference: ${reference}`);

  // Update withdrawal transaction status and refund wallet
  const transaction = await Transaction.findOne({ reference });
  if (transaction && transaction.type === 'withdrawal') {
    transaction.status = 'failed';
    transaction.failureReason = 'Transfer reversed';
    transaction.gatewayResponse = event.data;
    await transaction.save();

    // Refund the amount to wallet
    const wallet = await Wallet.findById(transaction.walletId);
    if (wallet) {
      await walletService.creditWallet(wallet, transaction.amount);
      console.log(`Refunded ₦${transaction.amount} to wallet for reversed transfer ${reference}`);
    }
  }
};

const storePaymentReference = async (reference, userId, amount) => {
  // Store in your database
  await Transaction.create({
    reference,
    userId,
    amount,
    status: 'pending',
    createdAt: new Date()
  });
};

// Find user by payment reference
const findUserByReference = async (reference) => {
  const transaction = await Transaction.findOne({
    reference,
    status: 'pending'
  });
  return transaction?.userId;
};

// Complete the wallet deposit
const completeWalletDeposit = async ({ userId, reference, amount, paystackData }) => {
  // Find transaction by reference first
  const transaction = await Transaction.findOne({ reference });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (transaction.status !== 'pending') {
    throw new Error('Invalid transaction status');
  }

  // Verify that the userId matches the wallet's userId
  const wallet = await Wallet.findById(transaction.walletId);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  if (wallet.userId.toString() !== userId.toString()) {
    throw new Error('User ID mismatch');
  }

  // Update transaction status
  transaction.status = 'completed';
  transaction.completedAt = new Date();
  transaction.gatewayResponse = paystackData;
  await transaction.save();

  // Credit user wallet
  await walletService.creditWallet(wallet, amount);

  console.log(`Wallet deposit completed: ${reference} - ₦${amount}`);
};

const verifyPaystackTransaction = async (req, res) => {
  const { reference, userId } = req.body;

  if (!reference) {
    console.error("Paystack verification: Missing transaction reference");
    return res.status(400).json({ message: "Transaction reference is required." });
  }

  console.log(`Verifying Paystack transaction: ${reference}, userId: ${userId}`);

  let transaction;

  try {
    transaction = await walletService.findTransactionByReference(reference);

    if (!transaction) {
      console.warn(`Paystack verification: Unknown transaction reference: ${reference}`);
    } else if (transaction.status === "completed") {
      console.log(`Paystack verification: Transaction already completed: ${reference}`);
      return res.status(200).json({
        message: "Transaction already completed.",
        transactionData: null,
      });
    }

    console.log(`Fetching Paystack transaction data for: ${reference}`);
    const paystackTransactionData = await walletService.fetchPaystackTransaction(reference);

    if (!paystackTransactionData) {
      console.error(`Paystack verification: No transaction data received for ${reference}`);
      if (transaction && transaction.status !== "completed") {
        await walletService.updateTransactionStatus(reference, "failed");
      }
      return res.status(500).json({ message: "Failed to fetch transaction data from Paystack." });
    }

    console.log(`Paystack transaction status: ${paystackTransactionData.status}`);

    const userIdToCredit = transaction
      ? (await Wallet.findById(transaction.walletId))?.userId
      : userId;

    if (!userIdToCredit) {
      console.error(`Paystack verification: Cannot determine user ID for transaction ${reference}`);
      if (transaction && transaction.status !== "completed") {
        await walletService.updateTransactionStatus(reference, "failed");
      } else if (!transaction) {
        await walletService.recordTransaction(
          null,
          reference,
          paystackTransactionData.amount / 100,
          "deposit",
          "failed",
          "paystack",
          {
            gatewayResponse: paystackTransactionData,
            error: "Wallet not found for user during verification",
          }
        );
      }
      return res.status(500).json({ message: "Could not identify user for crediting." });
    }

    switch (paystackTransactionData.status) {
      case "success":
        const wallet = await dbService.findWalletByUserId(userIdToCredit); // Use dbService
        if (!wallet) {
          console.error(
            `Paystack transaction success for ref ${reference}, but wallet not found for userId ${userIdToCredit}`
          );
          if (transaction && transaction.status !== "completed") {
            await walletService.updateTransactionStatus(reference, "failed");
          } else if (!transaction) {
            // CORRECTED: Pass arguments individually
            await walletService.recordTransaction(
              null, // walletId
              reference, // reference
              paystackTransactionData.amount / 100, // amount
              "deposit", // type
              "failed", // status (failed due to missing wallet)
              "paystack", // paymentMethod
              {
                gatewayResponse: paystackTransactionData,
                error: "Wallet not found for user during verification",
              } // details
            );
          }
          return res
            .status(404)
            .json({ message: "Wallet not found for crediting." });
        }

        const paystackAmount = paystackTransactionData.amount / 100;
        const localAmount = transaction?.amount;

        // Calculate Paystack processing fee
        const processingFee = await walletService.calculatePaystackFee(paystackAmount);
        const creditedAmount = paystackAmount - processingFee;

        await walletService.creditWallet(wallet, creditedAmount);

        let completedTransaction;
        if (transaction) {
          completedTransaction = await walletService.updateTransactionStatus(
            reference,
            "completed"
          );
          transaction.status = "completed";
          transaction.amount = creditedAmount;
          transaction.processingFee = processingFee;
          if (!transaction.walletId) transaction.walletId = wallet._id;
          transaction.gatewayResponse = paystackTransactionData;
          await transaction.save();
        } else {
          // CORRECTED: Pass arguments individually
          completedTransaction = await walletService.recordTransaction(
            wallet._id, // walletId
            reference, // reference
            creditedAmount, // amount
            "deposit", // type
            "completed", // status
            "paystack", // paymentMethod
            {
              gatewayResponse: paystackTransactionData,
              processingFee: processingFee,
              originalAmount: paystackAmount
            } // details
          );
          wallet.transactions.push(completedTransaction._id);
          await wallet.save();
          transaction = completedTransaction;
        }

        await walletService.handleReferralDepositReward(
          userIdToCredit,
          paystackAmount
        );

        const user = await dbService.findUserById(userIdToCredit);

        // Send email asynchronously to prevent transaction delays
        sendTransactionEmailNotification(user.email, user.username, {
          type: completedTransaction.type,
          product_name: "Paystack Deposit",
          status: completedTransaction.status,
          amount: completedTransaction.amount,
          balance: wallet.balance,
          reference: completedTransaction.reference,
          processingFee: processingFee,
          originalAmount: paystackAmount,
        }).catch(error => {
          console.error('Async Paystack verification email failed:', error.message);
        });

        return res.status(200).json({
          message: "Transaction successful",
          transactionData: paystackTransactionData,
          wallet: { balance: wallet.balance },
        });

      case "pending":
        if (!transaction) {
          // CORRECTED: Pass arguments individually
          await walletService.recordTransaction(
            null, // walletId (unknown initially)
            reference, // reference
            paystackTransactionData.amount / 100, // amount
            "deposit", // type
            "pending", // status
            "paystack", // paymentMethod
            { gatewayResponse: paystackTransactionData } // details
          );
        } else if (transaction.status !== "pending") {
          await walletService.updateTransactionStatus(reference, "pending");
        }

        return res.status(202).json({
          message: "Transaction is pending",
          transactionData: paystackTransactionData,
        });

      case "failed":
        if (!transaction) {
          // CORRECTED: Pass arguments individually
          await walletService.recordTransaction(
            null, // walletId
            reference, // reference
            paystackTransactionData.amount / 100, // amount
            "deposit", // type
            "failed", // status
            "paystack", // paymentMethod
            { gatewayResponse: paystackTransactionData } // details
          );
        } else if (transaction.status !== "failed") {
          await walletService.updateTransactionStatus(reference, "failed");
        }

        return res.status(400).json({
          message: "Transaction failed",
          transactionData: paystackTransactionData,
        });

      default:
        console.error(
          `Paystack returned unknown status for reference ${reference}: ${paystackTransactionData.status}`
        );
        if (!transaction) {
          // CORRECTED: Pass arguments individually
          await walletService.recordTransaction(
            null, // walletId
            reference, // reference
            paystackTransactionData.amount / 100, // amount
            "deposit", // type
            "failed", // status
            "paystack", // paymentMethod
            { gatewayResponse: paystackTransactionData } // details
          );
        } else if (transaction.status !== "failed") {
          await walletService.updateTransactionStatus(reference, "failed");
        }

        return res.status(400).json({
          message: "Unknown transaction status from Paystack",
          transactionData: paystackTransactionData,
        });
    }
  } catch (error) {
    console.error(
      "Error verifying Paystack transaction:",
      error.response?.data || error.message
    );

    if (transaction && transaction.status !== "completed") {
      try {
        await walletService.updateTransactionStatus(
          transaction.reference,
          "failed"
        );
        console.log(
          `Transaction ${transaction.reference} marked failed due to verification error.`
        );
      } catch (updateError) {
        console.error(
          "Failed to mark transaction as failed after verification error:",
          updateError
        );
      }
    } else if (!transaction && reference) {
      console.error(
        `Error during Paystack verification for unknown reference ${reference}:`,
        error.message
      );
    }

    return res.status(500).json({
      message: "Error verifying transaction",
      error: error.response?.data || error.message,
    });
  }
};

const withdrawWallet = async (req, res) => {
  const userId = req.user.id;
  const { amount, bankName, accountNumber, bankCode, feeDeductionMethod } = req.body;

  try {
    const wallet = await dbService.findWalletByUserId(userId);

    // Get wallet settings to calculate fees
    const walletSettings = await require("../model/WalletSettings").findOne();
    let withdrawalAmount = amount;
    let feeAmount = 0;

    if (walletSettings?.deductFeesFromWithdrawals) {
      const { percentage = 1, fixedFee = 50, cap = 500 } = walletSettings.withdrawalFee || {};
      const percentageFee = amount * (percentage / 100);
      feeAmount = Math.min(cap, fixedFee + percentageFee);

      if (feeDeductionMethod === "fromWallet") {
        // Deduct fee from wallet balance in addition to withdrawal amount
        walletService.checkWalletForDebit(wallet, amount + feeAmount);
        await walletService.debitWallet(wallet, amount + feeAmount);
      } else if (feeDeductionMethod === "fromWithdrawal") {
        // Deduct fee from withdrawal amount
        withdrawalAmount = amount - feeAmount;
        walletService.checkWalletForDebit(wallet, amount);
        await walletService.debitWallet(wallet, amount);
      } else {
        // Default to deducting from wallet
        walletService.checkWalletForDebit(wallet, amount + feeAmount);
        await walletService.debitWallet(wallet, amount + feeAmount);
      }
    } else {
      // No fee deduction enabled
      walletService.checkWalletForDebit(wallet, amount);
      await walletService.debitWallet(wallet, amount);
    }

    // CORRECTED: Pass arguments individually
    const transaction = await walletService.recordTransaction(
      wallet._id, // walletId
      `txn-${Date.now()}`, // reference
      withdrawalAmount, // amount (actual amount to be transferred)
      "withdrawal", // type
      "pending", // status - changed to pending for admin approval
      "naira_wallet", // paymentMethod
      {
        // details object
        bankName,
        accountNumber,
        bankCode,
        originalAmount: amount, // Original requested amount
        feeAmount: feeAmount, // Fee charged
        feeDeductionMethod: feeDeductionMethod, // How fee was deducted
        totalDebited: feeDeductionMethod === "fromWallet" ? amount + feeAmount : amount, // Total amount debited from wallet
      }
    );

    wallet.transactions.push(transaction._id);
    await wallet.save();

    const user = await dbService.findUserById(userId);

    // Send email asynchronously to prevent transaction delays
    const feeMessage = feeAmount > 0 ?
      `A fee of ₦${feeAmount.toLocaleString()} has been ${feeDeductionMethod === "fromWallet" ? "deducted from your wallet" : "deducted from your withdrawal amount"}.` :
      "";

    sendTransactionEmailNotification(user.email, user.username, {
      type: transaction.type,
      product_name: "Wallet Withdrawal Request",
      status: transaction.status,
      amount: transaction.amount,
      balance: wallet.balance,
      reference: transaction.reference,
      bankName: transaction.bankName,
      accountNumber: transaction.accountNumber,
      feeAmount: feeAmount,
      feeDeductionMethod: feeDeductionMethod,
      originalAmount: amount,
      message: `Your withdrawal request has been submitted and is pending admin approval. ${feeMessage}`,
    }).catch(error => {
      console.error('Async wallet withdrawal email failed:', error.message);
    });

    return res.status(200).json({
      message: "Withdrawal request submitted successfully. It will be processed after admin approval.",
      wallet: {
        balance: wallet.balance,
        transactions: wallet.transactions,
      },
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        status: transaction.status,
      },
    });
  } catch (error) {
    console.error("Error in withdrawWallet:", error);
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    res
      .status(500)
      .json({ message: "Error withdrawing from wallet", error: error.message });
  }
};

const withdrawFromWallet = async (req, res, isOTP = false) => {
   const userId = req.user.id;
   const {
     amount,
     bankName,
     accountNumber,
     bankCode,
     reference,
     authorizationCode,
   } = req.body;

   try {
     const wallet = await dbService.findWalletByUserId(userId);

     if (!isOTP) {
       walletService.checkWalletForDebit(wallet, amount);
     }

     if (!isOTP) {
       // Direct withdrawal request - no 3rd party integration
       await walletService.debitWallet(wallet, amount);

       // CORRECTED: Pass arguments individually
       const transaction = await walletService.recordTransaction(
         wallet._id, // walletId
         `txn-${Date.now()}`, // reference
         amount, // amount
         "withdrawal", // type
         "pending", // status - changed to pending for admin approval
         "bank_transfer", // paymentMethod - valid enum value for direct withdrawals
         {
           // details object
           bankName,
           accountNumber,
           bankCode,
         }
       );

       wallet.transactions.push(transaction._id);
       await wallet.save();

       const user = await dbService.findUserById(userId);
   
       // Send email to user asynchronously to prevent transaction delays
       sendTransactionEmailNotification(user.email, user.username, {
         type: transaction.type,
         product_name: "Wallet Withdrawal Request",
         status: transaction.status,
         amount: transaction.amount,
         balance: wallet.balance,
         reference: transaction.reference,
         bankName: transaction.bankName,
         accountNumber: transaction.accountNumber,
         message: "Your withdrawal request has been submitted and is pending admin approval.",
       }).catch(error => {
         console.error('Async wallet withdrawal email failed:', error.message);
       });
   
       // Send email notification to admin about new withdrawal request
       const adminEmail = process.env.EMAIL_USER || "ohtopup@gmail.com";
       sendTransactionEmailNotification(adminEmail, "Admin", {
         type: "withdrawal_request",
         product_name: "New Withdrawal Request",
         status: "pending",
         amount: transaction.amount,
         reference: transaction.reference,
         bankName: transaction.bankName,
         accountNumber: transaction.accountNumber,
         userEmail: user.email,
         username: user.username,
         message: `A new withdrawal request of ₦${transaction.amount} has been submitted by ${user.username} (${user.email}). Please review and process.`,
       }).catch(error => {
         console.error('Async admin withdrawal notification email failed:', error.message);
       });

       return res.status(200).json({
         message: "Withdrawal request submitted successfully. It will be processed after admin approval.",
         wallet: {
           balance: wallet.balance,
           transactions: wallet.transactions,
         },
         transaction: {
           id: transaction._id,
           amount: transaction.amount,
           status: transaction.status,
         },
       });
     } else {
       // OTP verification for existing withdrawal request
       const transaction = await walletService.findTransactionByReference(
         reference
       );

       if (!transaction) {
         return res
           .status(404)
           .json({
             message: "Pending transaction not found with this reference.",
           });
       }

       if (transaction.status !== "pending") {
         return res
           .status(400)
           .json({
             message: `Transaction status is ${transaction.status}, not pending for authorization.`,
           });
       }
       if (
         !transaction.walletId ||
         transaction.walletId.toString() !== wallet._id.toString()
       ) {
         console.error(
           `Security Alert: Transaction ${reference} wallet ID mismatch. User ${userId}, Tx Wallet ID ${transaction.walletId}`
         );
         return res
           .status(403)
           .json({ message: "Transaction does not belong to your wallet." });
       }

       // For direct withdrawals, OTP verification is simplified
       // In a real implementation, you might want to integrate with an SMS service
       if (authorizationCode !== "123456") { // Simple OTP check for demo
         return res.status(400).json({ message: "Invalid authorization code." });
       }

       const completedTransaction = await walletService.updateTransactionStatus(
         reference,
         "completed"
       );
       transaction.status = "completed";

       if (!wallet.transactions.includes(transaction._id)) {
         wallet.transactions.push(transaction._id);
         await wallet.save();
       }

       const user = await dbService.findUserById(userId);

       // Send email asynchronously to prevent transaction delays
       sendTransactionEmailNotification(user.email, user.username, {
         type: completedTransaction.type,
         product_name: "Wallet Withdrawal",
         status: completedTransaction.status,
         amount: completedTransaction.amount,
         balance: wallet.balance,
         reference: completedTransaction.reference,
         bankName: completedTransaction.bankName,
         accountNumber: completedTransaction.accountNumber,
       }).catch(error => {
         console.error('Async wallet withdrawal email failed:', error.message);
       });

       return res.status(200).json({
         message: "Withdrawal successful",
         wallet: {
           balance: wallet.balance,
           transactions: wallet.transactions,
         },
         transaction: {
           id: transaction._id,
           amount: transaction.amount,
           status: transaction.status,
           reference: transaction.reference,
         },
       });
     }
   } catch (error) {
     console.error("Error in withdrawFromWallet:", error);
     if (reference) {
       try {
         const tx = await walletService.findTransactionByReference(reference);
         if (tx && tx.status === "pending") {
           await walletService.updateTransactionStatus(reference, "failed");
           console.log(
             `Transaction ${reference} marked as failed due to withdrawal error.`
           );
         } else if (!tx) {
           console.error(
             `Withdrawal error for unknown transaction reference ${reference}`
           );
         }
       } catch (updateError) {
         console.error(
           `Failed to mark transaction ${reference} as failed after withdrawal error:`,
           updateError
         );
       }
     }

     if (error.status) {
       return res.status(error.status).json({ message: error.message });
     }
     res
       .status(500)
       .json({ message: error.message || "Error processing withdrawal" });
   }
 };

const withdrawMonnifyWallet = (req, res) => withdrawFromWallet(req, res, false);

const withdrawMonnifyWalletOTP = (req, res) =>
  withdrawFromWallet(req, res, true);

const withdrawWalletPaystack = async (req, res) => {
  const userId = req.user.id;
  const { name, bankName, amount, accountNumber, bankCode } = req.body;

  try {
    const wallet = await dbService.findWalletByUserId(userId);
    walletService.checkWalletForDebit(wallet, amount);

    const transactionReference = `txn-${Date.now()}`;

    const recipientData = {
      type: "nuban",
      name: name || `Withdrawal by ${userId}`,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
      metadata: { userId: userId.toString() },
    };

    const recipientDetails = await walletService.createPaystackRecipient(
      recipientData
    );
    const recipientCode = recipientDetails.recipient_code;

    const transferData = {
      source: "balance",
      amount: amount * 100,
      reference: transactionReference,
      recipient: recipientCode,
      reason: `Withdrawal request by user ${userId}`,
      metadata: { walletId: wallet._id.toString() },
    };

    const transferDetails = await walletService.initiatePaystackTransfer(
      transferData
    );

    await walletService.debitWallet(wallet, amount);

    // CORRECTED: Pass arguments individually
    const transaction = await walletService.recordTransaction(
      wallet._id, // walletId
      transactionReference, // reference
      amount, // amount
      "withdrawal", // type
      "pending", // status
      "paystack_transfer", // paymentMethod
      {
        // details
        bankName,
        accountNumber,
        bankCode,
        recipientCode: recipientCode,
        paystackStatus: transferDetails.status,
        gatewayReference: transferDetails.reference,
        transferCode: transferDetails.transfer_code,
      }
    );

    wallet.transactions.push(transaction._id);
    await wallet.save();

    const user = await dbService.findUserById(userId);
    // Send email asynchronously to prevent transaction delays
    sendTransactionEmailNotification(user.email, user.username, {
      type: transaction.type,
      product_name: "Paystack Withdrawal Initiation",
      status: transaction.status,
      amount: transaction.amount,
      balance: wallet.balance,
      reference: transaction.reference,
      bankName: transaction.bankName,
      accountNumber: transaction.accountNumber,
    }).catch(error => {
      console.error('Async Paystack withdrawal initiation email failed:', error.message);
    });

    return res.status(200).json({
      message: "Withdrawal initiated successfully. Please await bank credit.",
      wallet: {
        balance: wallet.balance,
        transactions: wallet.transactions,
      },
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        status: transaction.status,
        reference: transaction.reference,
        paystackTransferCode: transferDetails.transfer_code,
      },
      paystackResponse: transferDetails,
    });
  } catch (error) {
    console.error("Error in withdrawWalletPaystack:", error);

    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    } else if (error.cause?.code === "transfer_unavailable") {
      return res.status(403).json({ message: error.message });
    }
    if (transactionReference) {
      try {
        const tx = await walletService.findTransactionByReference(
          transactionReference
        );
        if (tx && tx.status === "pending") {
          await walletService.updateTransactionStatus(
            transactionReference,
            "failed"
          );
          console.log(
            `Transaction ${transactionReference} marked as failed due to Paystack withdrawal error.`
          );
        } else if (!tx) {
          console.error(
            `Paystack withdrawal failed before transaction record for ref ${transactionReference}`
          );
        }
      } catch (updateError) {
        console.error(
          `Failed to mark transaction ${transactionReference} as failed after withdrawal error:`,
          updateError
        );
      }
    }

    res.status(500).json({
      message: error.message || "Error withdrawing from wallet",
      error: error.cause?.details || error.message,
    });
  }
};

const toggleWalletStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const wallet = await Wallet.findById(id);
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    wallet.isActive = !wallet.isActive;
    await wallet.save();

    res.json({
      message: `Wallet has been ${wallet.isActive ? "enabled" : "disabled"}.`,
      wallet,
    });
  } catch (error) {
    console.error("Error toggling wallet status:", error);
    res.status(500).json({ message: "Error toggling wallet status", error });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { type, reference } = req.query;

    const query = {};
    if (type) {
      query.type = type;
    }
    if (reference) {
      query.reference = { $regex: reference, $options: "i" };
    }

    const transactions = await Transaction.find(query)
      .populate({
        path: "walletId",
        populate: {
          path: "userId",
          select: "username email",
        },
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    const transactionsWithUserDetails = transactions.map((transaction) => ({
      _id: transaction._id,
      reference: transaction.reference,
      amount: transaction.amount,
      type: transaction.type,
      timestamp: transaction.createdAt,
      status: transaction.status,
      bankName: transaction.bankName || null,
      accountNumber: transaction.accountNumber || null,
      bankCode: transaction.bankCode || null,
      user: {
        username: transaction.walletId?.userId?.username || "N/A",
        email: transaction.walletId?.userId?.email || "N/A",
        userId: transaction.walletId?.userId?._id || null,
      },
      walletId: transaction.walletId?._id || null,
    }));

    const totalTransactions = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalTransactions / limit);

    res.json({
      currentPage: page,
      totalPages: totalPages,
      totalTransactions: totalTransactions,
      transactions: transactionsWithUserDetails,
    });
  } catch (error) {
    console.error("Error fetching all transactions:", error);
    res.status(500).json({ message: "Error fetching transactions", error });
  }
};

const getTransactionsByUser = async (req, res) => {
  const userId = req.user.id;
  const { type, page = 1, limit = 10, reference } = req.query;

  try {
    const wallet = await dbService.findWalletByUserId(userId);

    // Get wallet transactions (deposits, withdrawals)
    const walletFilters = {
      walletId: wallet._id,
    };

    if (reference) {
      walletFilters.reference = { $regex: reference, $options: "i" };
    }

    // Get utility transactions (data, airtime, cable, electricity)
    const utilityFilters = {
      user: userId,
    };

    if (type && ['data', 'airtime', 'cable', 'electricity'].includes(type.toLowerCase())) {
      utilityFilters.type = type.toLowerCase();
    }

    if (reference) {
      utilityFilters.requestId = { $regex: reference, $options: "i" };
    }

    console.log('Wallet Controller - Utility query filters:', utilityFilters);

    // Fetch both types of transactions
    const [walletTransactions, utilityTransactions] = await Promise.all([
      Transaction.find(walletFilters).sort({ createdAt: -1 }),
      require("../model/Utility").find(utilityFilters).sort({ createdAt: -1 })
    ]);

    console.log('Wallet Controller - Raw query results:', {
      walletTransactionsCount: walletTransactions.length,
      utilityTransactionsCount: utilityTransactions.length,
      utilityFilters,
      userId,
      sampleUtilityTransaction: utilityTransactions[0] ? {
        id: utilityTransactions[0]._id,
        requestId: utilityTransactions[0].requestId,
        type: utilityTransactions[0].type,
        product_name: utilityTransactions[0].product_name,
        user: utilityTransactions[0].user
      } : null
    });

    // Combine and sort all transactions by date
    const allTransactions = [
      ...walletTransactions.map(tx => ({
        ...tx.toJSON(),
        transactionType: 'wallet',
        ...(tx.type === "withdrawal" && {
          bankName: tx.bankName,
          accountNumber: tx.accountNumber,
          bankCode: tx.bankCode,
        }),
      })),
      ...utilityTransactions.map(tx => ({
        ...tx.toJSON(),
        transactionType: 'utility',
        // Map utility transaction fields to match wallet transaction format
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        createdAt: tx.createdAt,
        reference: tx.requestId,
        product_name: tx.product_name,
        phone: tx.phone,
        // Enhanced data purchase fields
        ...(tx.provider && { provider: tx.provider }),
        ...(tx.network && { network: tx.network }),
        ...(tx.dataPlan && { dataPlan: tx.dataPlan }),
        ...(tx.dataAmount && { dataAmount: tx.dataAmount }),
        ...(tx.validity && { validity: tx.validity }),
        ...(tx.transactionType && { transactionType: tx.transactionType }),
        ...(tx.token && { token: tx.token }),
        ...(tx.units && { units: tx.units }),
        ...(tx.subscription_type && { subscription_type: tx.subscription_type }),
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply type filter if specified (for wallet transactions only)
    let filteredTransactions = allTransactions;
    if (type && !['data', 'airtime', 'cable', 'electricity'].includes(type.toLowerCase())) {
      filteredTransactions = allTransactions.filter(tx =>
        tx.transactionType === 'wallet' && tx.type === type.toLowerCase()
      );
    }

    // Apply pagination
    const totalTransactions = filteredTransactions.length;
    const totalPages = Math.ceil(totalTransactions / parseInt(limit));
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const paginatedTransactions = filteredTransactions.slice(offset, offset + limitNumber);

    console.log('Transaction History Debug:', {
      totalWalletTransactions: walletTransactions.length,
      totalUtilityTransactions: utilityTransactions.length,
      totalCombined: allTransactions.length,
      filteredCount: filteredTransactions.length,
      paginatedCount: paginatedTransactions.length,
      sampleTransaction: paginatedTransactions[0] ? {
        type: paginatedTransactions[0].type,
        transactionType: paginatedTransactions[0].transactionType,
        product_name: paginatedTransactions[0].product_name,
        status: paginatedTransactions[0].status
      } : null
    });

    res.json({
      totalTransactions,
      totalPages,
      currentPage: pageNumber,
      transactions: paginatedTransactions,
    });
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    handleServiceError(error, res);
  }
};

const getBanks = async (req, res) => {
  try {
    const response = await axios.get("https://api.paystack.co/bank", {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.data || !response.data.status || !response.data.data) {
      console.error("Paystack bank fetch failed:", response.data);
      return res
        .status(500)
        .json({
          message: "Invalid response from Paystack when fetching banks.",
        });
    }

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching banks from Paystack:", error);
    res
      .status(500)
      .json({ message: "Error fetching banks", error: error.message });
  }
};

// Get transaction details by request ID
const getTransactionDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!requestId) {
      return res.status(400).json({ message: "Request ID is required" });
    }

    let transaction = null;

    // First, try to find in Utility transactions (data, airtime, cable, electricity)
    const utilityTransaction = await require("../model/Utility").findOne({ requestId })
      .populate('user', 'username email firstName lastName phoneNumber');

    if (utilityTransaction) {
      // Check permissions - users can only see their own transactions
      if (userRole !== 'admin' && utilityTransaction.user._id.toString() !== userId) {
        return res.status(403).json({ message: "Access denied. You can only view your own transactions." });
      }

      transaction = {
        ...utilityTransaction.toJSON(),
        transactionType: 'utility',
        // Format for frontend consumption
        id: utilityTransaction._id,
        requestId: utilityTransaction.requestId,
        serviceID: utilityTransaction.serviceID,
        status: utilityTransaction.status,
        type: utilityTransaction.type,
        product_name: utilityTransaction.product_name,
        amount: utilityTransaction.amount,
        phone: utilityTransaction.phone,
        revenue: utilityTransaction.revenue,
        discount: utilityTransaction.discount,
        commissionRate: utilityTransaction.commissionRate,
        user: {
          id: utilityTransaction.user._id,
          username: utilityTransaction.user.username,
          email: utilityTransaction.user.email,
          firstName: utilityTransaction.user.firstName,
          lastName: utilityTransaction.user.lastName,
          phoneNumber: utilityTransaction.user.phoneNumber
        },
        transactionDate: utilityTransaction.createdAt,
        // Enhanced fields for data purchases
        provider: utilityTransaction.provider,
        network: utilityTransaction.network,
        dataPlan: utilityTransaction.dataPlan,
        dataAmount: utilityTransaction.dataAmount,
        validity: utilityTransaction.validity,
        providerStatus: utilityTransaction.providerStatus,
        token: utilityTransaction.token,
        units: utilityTransaction.units,
        subscription_type: utilityTransaction.subscription_type
      };
    } else {
      // If not found in Utility, try wallet transactions
      const walletTransaction = await Transaction.findOne({ reference: requestId })
        .populate({
          path: 'walletId',
          populate: {
            path: 'userId',
            select: 'username email firstName lastName phoneNumber'
          }
        });

      if (walletTransaction) {
        // Check permissions - users can only see their own transactions
        if (userRole !== 'admin' && walletTransaction.walletId.userId._id.toString() !== userId) {
          return res.status(403).json({ message: "Access denied. You can only view your own transactions." });
        }

        transaction = {
          ...walletTransaction.toJSON(),
          transactionType: 'wallet',
          // Format for frontend consumption
          id: walletTransaction._id,
          requestId: walletTransaction.reference,
          serviceID: null, // Wallet transactions don't have serviceID
          status: walletTransaction.status,
          type: walletTransaction.type,
          product_name: walletTransaction.type === 'deposit' ? 'Wallet Deposit' :
                       walletTransaction.type === 'withdrawal' ? 'Wallet Withdrawal' : 'Wallet Transaction',
          amount: walletTransaction.amount,
          phone: null, // Wallet transactions don't have phone
          revenue: walletTransaction.amount, // For wallet transactions, revenue = amount
          discount: 0,
          commissionRate: 0,
          user: {
            id: walletTransaction.walletId.userId._id,
            username: walletTransaction.walletId.userId.username,
            email: walletTransaction.walletId.userId.email,
            firstName: walletTransaction.walletId.userId.firstName,
            lastName: walletTransaction.walletId.lastName,
            phoneNumber: walletTransaction.walletId.userId.phoneNumber
          },
          transactionDate: walletTransaction.createdAt,
          // Wallet-specific fields
          bankName: walletTransaction.bankName,
          accountNumber: walletTransaction.accountNumber,
          bankCode: walletTransaction.bankCode,
          paymentMethod: walletTransaction.paymentMethod
        };
      }
    }

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({
      message: "Transaction details retrieved successfully",
      transaction
    });

  } catch (error) {
    console.error("Error fetching transaction details:", error);
    res.status(500).json({ message: "Error fetching transaction details", error: error.message });
  }
};

// Wallet Settings Management
const getWalletSettings = async (req, res) => {
  try {
    let settings = await WalletSettings.findOne();
    if (!settings) {
      // Create default settings if none exist
      settings = new WalletSettings();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    console.error("Error fetching wallet settings:", error);
    res.status(500).json({ message: "Error fetching wallet settings", error: error.message });
  }
};

const updateWalletSettings = async (req, res) => {
  try {
    const updateData = req.body;
    let settings = await WalletSettings.findOne();

    if (!settings) {
      settings = new WalletSettings(updateData);
    } else {
      // Update existing settings
      Object.keys(updateData).forEach(key => {
        if (typeof updateData[key] === 'object' && updateData[key] !== null) {
          // Handle nested objects
          Object.keys(updateData[key]).forEach(subKey => {
            settings[key][subKey] = updateData[key][subKey];
          });
        } else {
          settings[key] = updateData[key];
        }
      });
    }

    await settings.save();
    res.json({ message: "Wallet settings updated successfully", settings });
  } catch (error) {
    console.error("Error updating wallet settings:", error);
    res.status(500).json({ message: "Error updating wallet settings", error: error.message });
  }
};

const resetWalletSettings = async (req, res) => {
  try {
    await WalletSettings.deleteMany({});
    const defaultSettings = new WalletSettings();
    await defaultSettings.save();
    res.json({ message: "Wallet settings reset to defaults", settings: defaultSettings });
  } catch (error) {
    console.error("Error resetting wallet settings:", error);
    res.status(500).json({ message: "Error resetting wallet settings", error: error.message });
  }
};

// Helper function to create audit log
const createAuditLog = async (transactionId, adminId, oldStatus, newStatus, action, reason = null, req = null) => {
  try {
    const transaction = await Transaction.findById(transactionId).populate('walletId');
    if (!transaction) return;

    const auditLog = new WithdrawalAuditLog({
      transactionId,
      adminId,
      userId: transaction.walletId?.userId,
      oldStatus,
      newStatus,
      action,
      reason,
      amount: transaction.amount,
      bankDetails: {
        bankName: transaction.bankName,
        accountNumber: transaction.accountNumber,
        accountName: transaction.accountName,
        bankCode: transaction.bankCode,
      },
      gatewayReference: transaction.gatewayReference,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent'),
    });

    await auditLog.save();
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

// Get all withdrawal requests for admin
const getWithdrawalsForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, reference, userId } = req.query;

    const query = { type: 'withdrawal' };

    if (status) {
      query.status = status;
    }
    if (reference) {
      query.reference = { $regex: reference, $options: 'i' };
    }
    if (userId) {
      const wallet = await Wallet.findOne({ userId });
      if (wallet) {
        query.walletId = wallet._id;
      }
    }

    const withdrawals = await Transaction.find(query)
      .populate({
        path: 'walletId',
        populate: {
          path: 'userId',
          select: 'username email phoneNumber',
        },
      })
      .populate('adminId', 'username email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    const withdrawalsWithDetails = withdrawals.map((withdrawal) => ({
      _id: withdrawal._id,
      reference: withdrawal.reference,
      amount: withdrawal.amount,
      status: withdrawal.status,
      bankName: withdrawal.bankName,
      accountNumber: withdrawal.accountNumber,
      accountName: withdrawal.accountName,
      bankCode: withdrawal.bankCode,
      createdAt: withdrawal.createdAt,
      processingStartedAt: withdrawal.processingStartedAt,
      completedAt: withdrawal.completedAt,
      estimatedCompletionTime: withdrawal.estimatedCompletionTime,
      rejectionReason: withdrawal.rejectionReason,
      gatewayReference: withdrawal.gatewayReference,
      retryCount: withdrawal.retryCount,
      lastRetryAt: withdrawal.lastRetryAt,
      user: {
        id: withdrawal.walletId?.userId?._id,
        username: withdrawal.walletId?.userId?.username,
        email: withdrawal.walletId?.userId?.email,
        phoneNumber: withdrawal.walletId?.userId?.phoneNumber,
      },
      admin: withdrawal.adminId ? {
        id: withdrawal.adminId._id,
        username: withdrawal.adminId.username,
        email: withdrawal.adminId.email,
      } : null,
    }));

    const totalWithdrawals = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalWithdrawals / limit);

    res.json({
      currentPage: page,
      totalPages,
      totalWithdrawals,
      withdrawals: withdrawalsWithDetails,
    });
  } catch (error) {
    console.error('Error fetching withdrawals for admin:', error);
    res.status(500).json({ message: 'Error fetching withdrawals', error: error.message });
  }
};

// Approve withdrawal request
const approveWithdrawal = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.id;

  try {
    const withdrawal = await Transaction.findById(id);
    if (!withdrawal || withdrawal.type !== 'withdrawal') {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: `Cannot approve withdrawal with status: ${withdrawal.status}` });
    }

    const oldStatus = withdrawal.status;
    withdrawal.status = 'approved';
    withdrawal.adminId = adminId;
    await withdrawal.save();

    // Create audit log
    await createAuditLog(id, adminId, oldStatus, 'approved', 'approve', reason, req);

    // Send notification to user
    const wallet = await Wallet.findById(withdrawal.walletId).populate('userId');
    if (wallet?.userId) {
      sendTransactionEmailNotification(
        wallet.userId.email,
        wallet.userId.username,
        {
          type: 'withdrawal',
          product_name: 'Wallet Withdrawal',
          status: 'approved',
          amount: withdrawal.amount,
          balance: wallet.balance,
          reference: withdrawal.reference,
          bankName: withdrawal.bankName,
          accountNumber: withdrawal.accountNumber,
        }
      ).catch(error => console.error('Email notification failed:', error));
    }

    res.json({
      message: 'Withdrawal request approved successfully',
      withdrawal: {
        id: withdrawal._id,
        status: withdrawal.status,
        adminId: withdrawal.adminId,
      },
    });
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    res.status(500).json({ message: 'Error approving withdrawal', error: error.message });
  }
};

// Reject withdrawal request
const rejectWithdrawal = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.id;

  try {
    const withdrawal = await Transaction.findById(id);
    if (!withdrawal || withdrawal.type !== 'withdrawal') {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    if (!['pending', 'approved'].includes(withdrawal.status)) {
      return res.status(400).json({ message: `Cannot reject withdrawal with status: ${withdrawal.status}` });
    }

    const oldStatus = withdrawal.status;
    withdrawal.status = 'rejected';
    withdrawal.rejectionReason = reason;
    withdrawal.adminId = adminId;
    await withdrawal.save();

    // Refund amount to wallet if it was debited
    if (oldStatus === 'approved') {
      const wallet = await Wallet.findById(withdrawal.walletId);
      if (wallet) {
        await walletService.creditWallet(wallet, withdrawal.amount);
      }
    }

    // Create audit log
    await createAuditLog(id, adminId, oldStatus, 'rejected', 'reject', reason, req);

    // Send notification to user
    const wallet = await Wallet.findById(withdrawal.walletId).populate('userId');
    if (wallet?.userId) {
      sendTransactionEmailNotification(
        wallet.userId.email,
        wallet.userId.username,
        {
          type: 'withdrawal',
          product_name: 'Wallet Withdrawal',
          status: 'rejected',
          amount: withdrawal.amount,
          balance: wallet.balance,
          reference: withdrawal.reference,
          bankName: withdrawal.bankName,
          accountNumber: withdrawal.accountNumber,
          rejectionReason: reason,
          message: `Your withdrawal request has been rejected. Reason: ${reason}`,
        }
      ).catch(error => console.error('Email notification failed:', error));
    }

    res.json({
      message: 'Withdrawal request rejected successfully',
      withdrawal: {
        id: withdrawal._id,
        status: withdrawal.status,
        rejectionReason: withdrawal.rejectionReason,
        adminId: withdrawal.adminId,
      },
    });
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    res.status(500).json({ message: 'Error rejecting withdrawal', error: error.message });
  }
};

// Process withdrawal (initiate bank transfer)
const processWithdrawal = async (req, res) => {
  const { id } = req.params;
  const { gatewayReference } = req.body;
  const adminId = req.user.id;

  try {
    const withdrawal = await Transaction.findById(id);
    if (!withdrawal || withdrawal.type !== 'withdrawal') {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'approved') {
      return res.status(400).json({ message: `Cannot process withdrawal with status: ${withdrawal.status}` });
    }

    const oldStatus = withdrawal.status;
    withdrawal.status = 'processing';
    withdrawal.processingStartedAt = new Date();
    withdrawal.estimatedCompletionTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
    withdrawal.gatewayReference = gatewayReference;
    withdrawal.adminId = adminId;
    await withdrawal.save();

    // Create audit log
    await createAuditLog(id, adminId, oldStatus, 'processing', 'process', null, req);

    // Send notification to user
    const wallet = await Wallet.findById(withdrawal.walletId).populate('userId');
    if (wallet?.userId) {
      sendTransactionEmailNotification(
        wallet.userId.email,
        wallet.userId.username,
        {
          type: 'withdrawal',
          product_name: 'Wallet Withdrawal',
          status: 'processing',
          amount: withdrawal.amount,
          balance: wallet.balance,
          reference: withdrawal.reference,
          bankName: withdrawal.bankName,
          accountNumber: withdrawal.accountNumber,
          estimatedCompletionTime: withdrawal.estimatedCompletionTime,
        }
      ).catch(error => console.error('Email notification failed:', error));
    }

    res.json({
      message: 'Withdrawal processing initiated successfully',
      withdrawal: {
        id: withdrawal._id,
        status: withdrawal.status,
        processingStartedAt: withdrawal.processingStartedAt,
        estimatedCompletionTime: withdrawal.estimatedCompletionTime,
        gatewayReference: withdrawal.gatewayReference,
        adminId: withdrawal.adminId,
      },
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ message: 'Error processing withdrawal', error: error.message });
  }
};

// Complete withdrawal
const completeWithdrawal = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.id;

  try {
    const withdrawal = await Transaction.findById(id);
    if (!withdrawal || withdrawal.type !== 'withdrawal') {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'processing') {
      return res.status(400).json({ message: `Cannot complete withdrawal with status: ${withdrawal.status}` });
    }

    const oldStatus = withdrawal.status;
    withdrawal.status = 'completed';
    withdrawal.completedAt = new Date();
    withdrawal.adminId = adminId;
    await withdrawal.save();

    // Create audit log
    await createAuditLog(id, adminId, oldStatus, 'completed', 'complete', reason, req);

    // Send notification to user
    const wallet = await Wallet.findById(withdrawal.walletId).populate('userId');
    if (wallet?.userId) {
      sendTransactionEmailNotification(
        wallet.userId.email,
        wallet.userId.username,
        {
          type: 'withdrawal',
          product_name: 'Wallet Withdrawal',
          status: 'completed',
          amount: withdrawal.amount,
          balance: wallet.balance,
          reference: withdrawal.reference,
          bankName: withdrawal.bankName,
          accountNumber: withdrawal.accountNumber,
        }
      ).catch(error => console.error('Email notification failed:', error));
    }

    res.json({
      message: 'Withdrawal completed successfully',
      withdrawal: {
        id: withdrawal._id,
        status: withdrawal.status,
        completedAt: withdrawal.completedAt,
        adminId: withdrawal.adminId,
      },
    });
  } catch (error) {
    console.error('Error completing withdrawal:', error);
    res.status(500).json({ message: 'Error completing withdrawal', error: error.message });
  }
};

// Mark withdrawal as failed
const failWithdrawal = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.id;

  try {
    const withdrawal = await Transaction.findById(id);
    if (!withdrawal || withdrawal.type !== 'withdrawal') {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    if (!['processing', 'approved'].includes(withdrawal.status)) {
      return res.status(400).json({ message: `Cannot fail withdrawal with status: ${withdrawal.status}` });
    }

    const oldStatus = withdrawal.status;
    withdrawal.status = 'failed';
    withdrawal.failureReason = reason;
    withdrawal.adminId = adminId;
    await withdrawal.save();

    // Refund amount to wallet
    const wallet = await Wallet.findById(withdrawal.walletId);
    if (wallet) {
      await walletService.creditWallet(wallet, withdrawal.amount);
    }

    // Create audit log
    await createAuditLog(id, adminId, oldStatus, 'failed', 'fail', reason, req);

    // Send notification to user
    if (wallet?.userId) {
      const user = await User.findById(wallet.userId);
      if (user) {
        sendTransactionEmailNotification(
          user.email,
          user.username,
          {
            type: 'withdrawal',
            product_name: 'Wallet Withdrawal',
            status: 'failed',
            amount: withdrawal.amount,
            balance: wallet.balance,
            reference: withdrawal.reference,
            bankName: withdrawal.bankName,
            accountNumber: withdrawal.accountNumber,
            failureReason: reason,
            message: `Your withdrawal request has failed and the amount has been refunded to your wallet. Reason: ${reason}`,
          }
        ).catch(error => console.error('Email notification failed:', error));
      }
    }

    res.json({
      message: 'Withdrawal marked as failed successfully',
      withdrawal: {
        id: withdrawal._id,
        status: withdrawal.status,
        adminId: withdrawal.adminId,
      },
    });
  } catch (error) {
    console.error('Error failing withdrawal:', error);
    res.status(500).json({ message: 'Error failing withdrawal', error: error.message });
  }
};

// Retry failed withdrawal
const retryWithdrawal = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.id;

  try {
    const withdrawal = await Transaction.findById(id);
    if (!withdrawal || withdrawal.type !== 'withdrawal') {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'failed') {
      return res.status(400).json({ message: `Cannot retry withdrawal with status: ${withdrawal.status}` });
    }

    // Get the wallet associated with this withdrawal
    const wallet = await Wallet.findById(withdrawal.walletId);
    if (!wallet) {
      return res.status(404).json({ message: 'Associated wallet not found' });
    }

    // Check if wallet has sufficient balance for retry
    try {
      walletService.checkWalletForDebit(wallet, withdrawal.amount);
    } catch (error) {
      return res.status(400).json({
        message: 'Insufficient funds in wallet for retry',
        error: error.message
      });
    }

    // Debit the amount from wallet again for retry
    await walletService.debitWallet(wallet, withdrawal.amount);

    const oldStatus = withdrawal.status;
    withdrawal.status = 'approved'; // Reset to approved for re-processing
    withdrawal.retryCount = (withdrawal.retryCount || 0) + 1;
    withdrawal.lastRetryAt = new Date();
    withdrawal.adminId = adminId;
    await withdrawal.save();

    // Create audit log
    await createAuditLog(id, adminId, oldStatus, 'approved', 'retry', reason, req);

    res.json({
      message: 'Withdrawal retry initiated successfully - amount debited again',
      withdrawal: {
        id: withdrawal._id,
        status: withdrawal.status,
        retryCount: withdrawal.retryCount,
        lastRetryAt: withdrawal.lastRetryAt,
        adminId: withdrawal.adminId,
      },
    });
  } catch (error) {
    console.error('Error retrying withdrawal:', error);
    res.status(500).json({ message: 'Error retrying withdrawal', error: error.message });
  }
};

// Get withdrawal audit logs
const getWithdrawalAuditLogs = async (req, res) => {
  try {
    const { transactionId, adminId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (transactionId) query.transactionId = transactionId;
    if (adminId) query.adminId = adminId;

    const auditLogs = await WithdrawalAuditLog.find(query)
      .populate('transactionId', 'reference amount status')
      .populate('adminId', 'username email')
      .populate('userId', 'username email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .exec();

    const totalLogs = await WithdrawalAuditLog.countDocuments(query);
    const totalPages = Math.ceil(totalLogs / limit);

    res.json({
      currentPage: parseInt(page),
      totalPages,
      totalLogs,
      auditLogs,
    });
  } catch (error) {
    console.error('Error fetching withdrawal audit logs:', error);
    res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
  }
};

// Test webhook endpoint (remove in production)
const testWebhook = async (req, res) => {
  console.log('Test webhook received:', req.body);
  res.status(200).json({
    message: 'Test webhook received successfully',
    timestamp: new Date().toISOString(),
    body: req.body
  });
};

module.exports = {
  createWallet,
  getWallet,
  getWallets,
  depositWallet,
  withdrawWallet,
  toggleWalletStatus,
  getAllTransactions,
  getTransactionsByUser,
  getTransactionDetails,
  getBanks,
  depositWalletWithPaystack,
  verifyPaystackTransaction,
  handlePaystackCallback,
  withdrawWalletPaystack,
  depositWalletWithMonnify,
  verifyMonnifyTransaction,
  withdrawMonnifyWallet,
  withdrawMonnifyWalletOTP,
  depositPaystackWallet,
  getWalletSettings,
  updateWalletSettings,
  resetWalletSettings,
  handlePaystackWebhook,
  testWebhook,
  // New withdrawal management functions
  getWithdrawalsForAdmin,
  approveWithdrawal,
  rejectWithdrawal,
  processWithdrawal,
  completeWithdrawal,
  failWithdrawal,
  retryWithdrawal,
  getWithdrawalAuditLogs,

};
