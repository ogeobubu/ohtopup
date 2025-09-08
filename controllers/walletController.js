// walletController.js

const Wallet = require("../model/Wallet");
const User = require("../model/User");
const Transaction = require("../model/Transaction");
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

    await sendTransactionEmailNotification(user.email, user.username, {
      type: completedTransaction.type,
      product_name: "Wallet Deposit",
      status: completedTransaction.status,
      amount: completedTransaction.amount,
      balance: wallet.balance,
      reference: completedTransaction.reference,
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
  const { userId, amount: rawAmount, reference } = req.body;

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

    // CORRECTED: Pass arguments individually
    const transaction = await walletService.recordTransaction(
      wallet._id, // walletId
      reference, // reference
      amount, // amount
      "deposit", // type
      "completed", // status
      "paystack" // paymentMethod
    );

    await walletService.creditWallet(wallet, amount);

    wallet.transactions.push(transaction._id);
    await wallet.save();

    await walletService.handleReferralDepositReward(userId, amount);

    const user = await dbService.findUserById(userId);

    await sendTransactionEmailNotification(user.email, user.username, {
      type: transaction.type,
      product_name: "Paystack Deposit",
      status: transaction.status,
      amount: transaction.amount,
      balance: wallet.balance,
      reference: transaction.reference,
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
  const { userId, amount, paymentMethod, email } = req.body;

  try {
    const wallet = await dbService.findWalletByUserId(userId);

    const transactionReference = `txn_${Date.now()}_${userId}`;
    const totalAmount = amount * 100;

    // CORRECTED: Pass arguments individually
    const transaction = await walletService.recordTransaction(
      wallet._id, // walletId
      transactionReference, // reference
      amount, // amount
      "deposit", // type
      "pending", // status
      paymentMethod // paymentMethod
    );

    const paymentData = {
      email,
      amount: totalAmount,
      currency: "NGN",
      reference: transactionReference,
      callback_url: `${process.env.BASE_URL}/api/wallet/deposit/paystack/verify`,
    };

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (
      !response.data ||
      !response.data.status ||
      !response.data.data ||
      !response.data.data.authorization_url
    ) {
      console.error(
        "Paystack initialization failed after recording transaction:",
        response.data
      );
      await walletService.updateTransactionStatus(
        transactionReference,
        "failed"
      );
      return res.status(500).json({
        message: "Paystack initialization failed",
        error: response.data?.message || "Invalid response from Paystack",
      });
    }

    res.json({
      reference: transactionReference,
      url: response.data.data.authorization_url,
    });
  } catch (error) {
    console.error(
      "Error initiating deposit with Paystack:",
      error.response?.data || error
    );
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({
      message: "Error initiating deposit with Paystack",
      error: error.response?.data || "Internal Server Error",
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

      await sendTransactionEmailNotification(user.email, user.username, {
        type: completedTransaction.type,
        product_name: "Monnify Deposit",
        status: completedTransaction.status,
        amount: completedTransaction.amount,
        balance: wallet.balance,
        reference: completedTransaction.reference,
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

const verifyPaystackTransaction = async (req, res) => {
  const { reference, userId } = req.body;

  if (!reference) {
    return res
      .status(400)
      .json({ message: "Transaction reference is required." });
  }

  let transaction;

  try {
    transaction = await walletService.findTransactionByReference(reference);

    if (!transaction) {
      console.warn(
        `Paystack verification request for unknown transaction reference: ${reference}`
      );
    } else if (transaction.status === "completed") {
      console.log(
        `Paystack verification request for already completed transaction: ${reference}`
      );
      return res
        .status(200)
        .json({
          message: "Transaction already completed.",
          transactionData: null,
        });
    }

    const paystackTransactionData =
      await walletService.fetchPaystackTransaction(reference);

    const userIdToCredit = transaction
      ? (await Wallet.findById(transaction.walletId))?.userId
      : userId; // Direct model find here
    if (!userIdToCredit) {
      console.error(
        `Cannot determine user ID for crediting for transaction reference: ${reference}`
      );
      if (transaction && transaction.status !== "completed") {
        await walletService.updateTransactionStatus(reference, "failed");
      } else if (!transaction) {
        // CORRECTED: Pass arguments individually
        await walletService.recordTransaction(
          null, // walletId (unknown)
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
        .status(500)
        .json({ message: "Could not identify user for crediting." });
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

        await walletService.creditWallet(wallet, paystackAmount);

        let completedTransaction;
        if (transaction) {
          completedTransaction = await walletService.updateTransactionStatus(
            reference,
            "completed"
          );
          transaction.status = "completed";
          transaction.amount = paystackAmount;
          if (!transaction.walletId) transaction.walletId = wallet._id;
          transaction.gatewayResponse = paystackTransactionData;
          await transaction.save();
        } else {
          // CORRECTED: Pass arguments individually
          completedTransaction = await walletService.recordTransaction(
            wallet._id, // walletId
            reference, // reference
            paystackAmount, // amount
            "deposit", // type
            "completed", // status
            "paystack", // paymentMethod
            { gatewayResponse: paystackTransactionData } // details
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

        await sendTransactionEmailNotification(user.email, user.username, {
          type: completedTransaction.type,
          product_name: "Paystack Deposit",
          status: completedTransaction.status,
          amount: completedTransaction.amount,
          balance: wallet.balance,
          reference: completedTransaction.reference,
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
  const { amount, bankName, accountNumber, bankCode } = req.body;

  try {
    const wallet = await dbService.findWalletByUserId(userId);
    walletService.checkWalletForDebit(wallet, amount);

    await walletService.debitWallet(wallet, amount);

    // CORRECTED: Pass arguments individually
    const transaction = await walletService.recordTransaction(
      wallet._id, // walletId
      `txn-${Date.now()}`, // reference
      amount, // amount
      "withdrawal", // type
      "completed", // status
      "naira_wallet", // paymentMethod
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

    await sendTransactionEmailNotification(user.email, user.username, {
      type: transaction.type,
      product_name: "Wallet Withdrawal",
      status: transaction.status,
      amount: transaction.amount,
      balance: wallet.balance,
      reference: transaction.reference,
      bankName: transaction.bankName,
      accountNumber: transaction.accountNumber,
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

    const apiKey = process.env.MONNIFY_API_KEY;
    const clientSecret = process.env.MONNIFY_SECRET_KEY;
    const base64Credentials = Buffer.from(`${apiKey}:${clientSecret}`).toString(
      "base64"
    );

    const accessToken = await walletService.authenticateMonnify(
      base64Credentials
    );

    if (!isOTP) {
      const transactionReference = `txn-${Date.now()}`;
      const monnifyData = {
        amount,
        reference: transactionReference,
        narration: "Withdrawal Request",
        destinationBankCode: bankCode,
        destinationAccountNumber: accountNumber,
        currency: "NGN",
        sourceAccountNumber: process.env.MONNIFY_ACCOUNT_NUMBER,
        async: true,
      };
      const withdrawData = await walletService.initiateMonnifyWithdrawal(
        accessToken,
        monnifyData
      );

      // CORRECTED: Pass arguments individually
      const transaction = await walletService.recordTransaction(
        wallet._id, // walletId
        transactionReference, // reference
        amount, // amount
        "withdrawal", // type
        "pending", // status
        "monnify", // paymentMethod
        {
          // details
          bankName,
          accountNumber,
          bankCode,
          gatewayReference: withdrawData.responseBody?.disbursementReference, // Store Monnify's reference
        }
      );

      wallet.transactions.push(transaction._id);
      await wallet.save();

      return res.status(200).json({
        message:
          "Withdrawal processing started. Please complete authorization.",
        transaction: {
          id: transaction._id,
          amount: transaction.amount,
          status: transaction.status,
          reference: transaction.reference,
          monnifyDisbursementRef:
            withdrawData.responseBody?.disbursementReference,
        },
        monnifyResponse: withdrawData.responseBody,
      });
    } else {
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

      const authorizationData = { reference, authorizationCode };

      const withdrawData = await walletService.authorizeMonnifyWithdrawal(
        accessToken,
        authorizationData
      );

      await walletService.debitWallet(wallet, transaction.amount);

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

      await sendTransactionEmailNotification(user.email, user.username, {
        type: completedTransaction.type,
        product_name: "Monnify Withdrawal",
        status: completedTransaction.status,
        amount: completedTransaction.amount,
        balance: wallet.balance,
        reference: completedTransaction.reference,
        bankName: completedTransaction.bankName,
        accountNumber: completedTransaction.accountNumber,
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
        monnifyResponse: withdrawData.responseBody,
      });
    }
  } catch (error) {
    console.error("Error in withdrawFromWallet (Monnify):", error);
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
    await sendTransactionEmailNotification(user.email, user.username, {
      type: transaction.type,
      product_name: "Paystack Withdrawal Initiation",
      status: transaction.status,
      amount: transaction.amount,
      balance: wallet.balance,
      reference: transaction.reference,
      bankName: transaction.bankName,
      accountNumber: transaction.accountNumber,
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
  withdrawWalletPaystack,
  depositWalletWithMonnify,
  verifyMonnifyTransaction,
  withdrawMonnifyWallet,
  withdrawMonnifyWalletOTP,
  depositPaystackWallet,
};
