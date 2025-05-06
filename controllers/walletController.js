const Wallet = require("../model/Wallet");
const User = require("../model/User");
const Transaction = require("../model/Transaction");
const axios = require("axios");
const { generateRandomAccountNumber } = require("../utils");
const { handleServiceError } = require('../middleware/errorHandler');

const fetchBankCodes = async () => {
  try {
    const response = await axios.get("https://api.paystack.co/bank", {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    return response.data.data;
  } catch (error) {
    console.error("Error fetching bank codes:", error);
    throw error;
  }
};

const createWallet = async (req, res) => {
  const { userId } = req.body;
  try {
    const wallet = new Wallet({ userId });
    await wallet.save();
    res.status(201).json(wallet);
  } catch (error) {
    res.status(500).json({ message: "Error creating wallet", error });
  }
};

const getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user.id });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (!wallet.isActive) {
      return res.status(404).json({ message: "Your wallet is disabled" });
    }

    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: "Error fetching wallet", error });
  }
};

const getWallets = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Fetch the wallets with pagination, sorted to show the latest first
    const wallets = await Wallet.find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // Latest wallets first
      .populate("userId", "username email")
      .exec();

    // Array to hold wallets to delete
    const walletsToDelete = [];

    const walletDetails = await Promise.all(wallets.map(async (wallet) => {
      if (!wallet.userId || !wallet.userId.username || !wallet.userId.email) {
        // If user doesn't exist, mark wallet for deletion
        walletsToDelete.push(wallet._id);
        return null; // Skip this wallet in the response
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
    }));

    // Delete wallets that don't have valid users
    if (walletsToDelete.length > 0) {
      await Wallet.deleteMany({ _id: { $in: walletsToDelete } });
    }

    const totalCount = await Wallet.countDocuments({});
    const totalPages = Math.ceil(totalCount / limit);

    // Calculate total wallet balance
    const totalBalance = await Wallet.aggregate([
      { $group: { _id: null, total: { $sum: "$balance" } } }
    ]);

    const totalWalletAmount = totalBalance.length > 0 ? totalBalance[0].total : 0;

    res.json({
      currentPage: page,
      totalPages: totalPages,
      totalWallets: totalCount,
      totalWalletAmount: totalWalletAmount,
      wallets: walletDetails.filter(Boolean), // Filter out null values
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
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    transaction = new Transaction({
      walletId: wallet._id,
      amount,
      type: "deposit",
      status: "pending",
      reference: `txn_${Date.now()}_${userId}`,
      paymentMethod: "naira_wallet",
    });
    await transaction.save();

    wallet.balance += amount;
    wallet.transactions.push(transaction._id);
    await wallet.save();

    transaction.status = "completed";
    await transaction.save();

    if (amount > 1000) {
      const user = await User.findById(userId);
      if (user && user.referrerId) {
        const referrer = await User.findById(user.referrerId);
        if (referrer) {
          if (!referrer.referralDepositMap.get(userId)) {
            referrer.points += 1;
            referrer.totalReferralPoints += 1;
            referrer.referralDepositMap.set(userId, true);
            await referrer.save();
          }
        }
      }
    }

    res.json(wallet);
  } catch (error) {
    if (transaction) {
      transaction.status = "failed";
      await transaction.save();
    }
    res.status(500).json({ message: "Error depositing to wallet", error });
  }
};

const depositPaystackWallet = async (req, res) => {
  const { userId, amount: rawAmount, reference } = req.body;
  let transaction = null;

  const amount = Number(rawAmount);

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: "Amount must be a positive number." });
  }
  if (amount < 1000) {
    return res.status(400).json({ message: "Amount must be at least 1000." });
  }

  try {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found." });
    }

    // Check if this is the user's first deposit
    const user = await User.findById(userId);
    const isFirstDeposit = wallet.transactions.length === 0;

    transaction = new Transaction({
      walletId: wallet._id,
      amount,
      type: "deposit",
      status: "pending",
      reference,
      paymentMethod: "paystack",
    });
    await transaction.save();

    wallet.balance += amount;
    wallet.transactions.push(transaction._id);
    await wallet.save();

    transaction.status = "completed";
    await transaction.save();

    if (isFirstDeposit && amount >= 1000) {
      const referrer = user.referrerCode ? await User.findOne({ referralCode: user.referrerCode }) : null;
      if (referrer) {
        referrer.points = (referrer.points || 0) + 10;
        await referrer.save();
      }
    }

    res.json(wallet);
  } catch (error) {
    if (transaction) {
      transaction.status = "failed";
      await transaction.save();
    }
    res.status(500).json({ message: "Error depositing to wallet.", error: error.message || error });
  }
};

const depositWalletWithPaystack = async (req, res) => {
  const { userId, amount, paymentMethod, email } = req.body;

  try {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    const transactionReference = `txn_${Date.now()}_${userId}`;
    const totalAmount = amount * 100;

    const transaction = new Transaction({
      walletId: wallet._id,
      amount,
      type: "deposit",
      status: "pending",
      reference: transactionReference,
      paymentMethod,
    });
    await transaction.save();

    const paymentData = {
      email,
      amount: totalAmount,
      currency: "NGN",
      reference: transactionReference,
      callback_url: "https://yourdomain.com/api/payment/callback",
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

    res.json({
      reference: transactionReference,
      url: response.data.data.authorization_url,
    });
  } catch (error) {
    console.error(
      "Error initiating deposit with Paystack:",
      error.response?.data || error
    );
    res.status(500).json({
      message: "Error initiating deposit with Paystack",
      error: error.response?.data,
    });
  }
};

const depositWalletWithMonnify = async (req, res) => {
  const { userId, actualAmount, amount, email } = req.body;

  try {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    const transactionReference = `txn_${Date.now()}_${userId}`;
    const totalAmount = amount;

    const paymentData = {
      customerEmail: email,
      amount: totalAmount,
      currencyCode: "NGN",
      paymentReference: transactionReference,
      paymentDescription: "Deposit Payment",
      contractCode: process.env.MONNIFY_CONTRACT,
      callback_url: `https://google.com`,
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

    await recordTransaction(
      wallet._id,
      response.data.responseBody.transactionReference,
      actualAmount,
      "deposit",
      "pending",
      paymentData.paymentMethod
    );

    res.json({
      reference: response.data.responseBody.transactionReference,
      url: response.data.responseBody.checkoutUrl,
    });
  } catch (error) {
    console.error(
      "Error initiating deposit with Monnify:",
      error.response ? error.response.data : error
    );
    res.status(500).json({
      message: "Error initiating deposit with Monnify",
      error: error.response ? error.response.data : error,
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

  try {
    const getAmount = await Transaction.findOne({
      reference: ref,
      status: "pending",
    });

    const existingTransaction = await Transaction.findOne({
      reference: ref,
      status: "completed",
    });

    if (existingTransaction) {
      return res
        .status(400)
        .json({ message: "Transaction already completed." });
    }

    const accessToken = await authenticateMonnify(base64Credentials);
    const transactionData = await fetchTransaction(encodedRef, accessToken);

    const actualAmount = getAmount.amount;

    const wallet = await Wallet.findOne({ userId });
    const settlementAmount = actualAmount;

    if (transactionData.responseBody.paymentStatus === "PAID") {
      await updateWalletBalance(wallet, settlementAmount);
      await updateTransactionStatus(ref, "completed");

      return res.status(200).json({
        status: "paid",
        message: "Transaction successful",
        transactionData,
      });
    } else if (transactionData.responseBody.paymentStatus === "PENDING") {
      await updateTransactionStatus(ref, "pending");
      return res.status(200).json({
        status: "pending",
        message: "Transaction pending",
        transactionData,
      });
    } else {
      await updateTransactionStatus(ref, "failed");
      return res.status(200).json({
        status: "failed",
        message: "Transaction failed",
        transactionData,
      });
    }
  } catch (error) {
    console.error(
      "Error verifying transaction:",
      error.response?.data || error
    );
    res.status(500).json({
      message: "Error verifying transaction",
      error: error.response?.data || "Internal server error",
    });
  }
};

const authenticateMonnify = async (base64Credentials) => {
  const response = await axios.post(
    `${process.env.MONNIFY_URL}/api/v1/auth/login`,
    {},
    {
      headers: {
        Authorization: `Basic ${base64Credentials}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data.responseBody.accessToken;
};

const fetchTransaction = async (encodedRef, accessToken) => {
  const response = await axios.get(
    `${process.env.MONNIFY_URL}/api/v2/transactions/${encodedRef}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

const monnifyWithdrawUrl = async (accessToken, data) => {
  const response = await axios.post(
    `${process.env.MONNIFY_URL}/api/v2/disbursements/single`,
    data,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

const monnifyWithdrawUrlAuthorize = async (accessToken, data) => {
  const response = await axios.post(
    `${process.env.MONNIFY_URL}/api/v2/disbursements/single/validate-otp`,
    data,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

const updateWalletBalance = async (wallet, amount) => {
  if (wallet) {
    wallet.balance += amount;
    await wallet.save();
  }
};

const recordTransaction = async (
  walletId,
  reference,
  amount,
  type,
  status,
  paymentMethod
) => {
  const transaction = new Transaction({
    walletId,
    amount,
    type,
    status,
    reference,
    paymentMethod,
  });
  await transaction.save();
};

const updateTransactionStatus = async (reference, newStatus) => {
  try {
    const transaction = await Transaction.findOne({ reference });

    if (!transaction) {
      throw new Error("Transaction not found");
    }
    transaction.status = newStatus;

    await transaction.save();

    return transaction;
  } catch (error) {
    console.error("Error updating transaction status:", error);
    throw error;
  }
};

const verifyPaystackTransaction = async (req, res) => {
  const { reference, userId } = req.body;

  try {
    const { data } = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const transactionData = data.data;

    switch (transactionData.status) {
      case "success":
        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
          return res.status(404).json({ message: "Wallet not found." });
        }

        wallet.balance += transactionData.amount / 100;
        await wallet.save();

        const successTransaction = new Transaction({
          walletId: wallet._id,
          amount: transactionData.amount / 100,
          type: "deposit",
          status: "completed",
          reference,
          paymentMethod: "paystack",
        });
        await successTransaction.save();

        return res.status(200).json({
          message: "Transaction successful",
          transactionData,
        });

      case "pending":
        const pendingTransaction = new Transaction({
          walletId: null,
          amount: transactionData.amount / 100,
          type: "deposit",
          status: "pending",
          reference,
          paymentMethod: "paystack",
        });
        await pendingTransaction.save();

        return res.status(202).json({
          message: "Transaction is pending",
          transactionData,
        });

      case "failed":
        const failedTransaction = new Transaction({
          walletId: null,
          amount: transactionData.amount / 100,
          type: "deposit",
          status: "failed",
          reference,
          paymentMethod: "paystack",
        });
        await failedTransaction.save();

        return res.status(400).json({
          message: "Transaction failed",
          transactionData,
        });

      default:
        return res.status(400).json({
          message: "Unknown transaction status",
          transactionData,
        });
    }
  } catch (error) {
    console.error(
      "Error verifying transaction:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Error verifying transaction",
      error: error.response?.data || error.message,
    });
  }
};

const withdrawWallet = async (req, res) => {
  const { amount, bankName, accountNumber, bankCode } = req.body;

  try {
    const wallet = await Wallet.findOne({ userId: req.user.id });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    wallet.balance -= amount;
    const transaction = new Transaction({
      walletId: wallet._id,
      amount,
      type: "withdrawal",
      bankName,
      accountNumber,
      bankCode,
      status: "pending",
      paymentMethod: "naira_wallet",
      reference: `txn-${Date.now()}`,
    });
    await transaction.save();

    wallet.transactions.push(transaction._id);
    await wallet.save();

    transaction.status = "completed";
    await transaction.save();

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
    console.error(error);

    return res
      .status(500)
      .json({ message: "Error withdrawing from wallet", error: error.message });
  }
};

const withdrawFromWallet = async (req, res, isOTP = false) => {
  const {
    amount,
    bankName,
    accountNumber,
    bankCode,
    reference,
    authorizationCode,
  } = req.body;

  try {
    const wallet = await Wallet.findOne({ userId: req.user.id });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    const apiKey = process.env.MONNIFY_API_KEY;
    const clientSecret = process.env.MONNIFY_SECRET_KEY;
    const base64Credentials = Buffer.from(`${apiKey}:${clientSecret}`).toString(
      "base64"
    );

    const data = isOTP
      ? { reference, authorizationCode }
      : {
          amount,
          reference: `txn-${Date.now()}`,
          narration: "Withdrawal Request",
          destinationBankCode: bankCode,
          destinationAccountNumber: accountNumber,
          currency: "NGN",
          sourceAccountNumber: process.env.MONNIFY_ACCOUNT_NUMBER,
          async: true,
        };

    const accessToken = await authenticateMonnify(base64Credentials);
    const withdrawData = isOTP
      ? await monnifyWithdrawUrlAuthorize(accessToken, data)
      : await monnifyWithdrawUrl(accessToken, data);

    if (!withdrawData.requestSuccessful) {
      return res.status(400).json({
        message: withdrawData.responseMessage,
        code: withdrawData.responseCode,
      });
    }

    if (!isOTP) {
      const transaction = new Transaction({
        walletId: wallet._id,
        amount,
        type: "withdrawal",
        bankName,
        accountNumber,
        bankCode,
        status: "pending",
        paymentMethod: "naira_wallet",
        reference: data.reference,
      });
      await transaction.save();

      return res.status(200).json({
        message: "Withdrawal processing",
        transaction: {
          id: transaction._id,
          amount: transaction.amount,
          status: transaction.status,
          reference: transaction.reference,
        },
      });
    } else {
      const transaction = await Transaction.findOne({ reference });

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      wallet.balance -= amount;
      await wallet.save();

      transaction.status = "completed";
      await transaction.save();

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
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error processing withdrawal", error: error.message });
  }
};

const withdrawMonnifyWallet = (req, res) => withdrawFromWallet(req, res);
const withdrawMonnifyWalletOTP = (req, res) =>
  withdrawFromWallet(req, res, true);

const withdrawWalletPaystack = async (req, res) => {
  const { name, bankName, amount, accountNumber, bankCode } = req.body;

  try {
    // Find the user's wallet
    const wallet = await Wallet.findOne({ userId: req.user.id });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Check for sufficient funds
    if (wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    // Prepare data for Paystack recipient creation
    const recipientData = {
      type: "nuban",
      name,
      account_number: accountNumber, // Use a test account number
      bank_code: bankCode, // Use a test bank code
      currency: "NGN",
    };

    // Create a recipient on Paystack
    const recipientResponse = await axios.post(
      `https://api.paystack.co/transferrecipient`,
      recipientData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!recipientResponse.data.data.recipient_code) {
      return res
        .status(500)
        .json({ error: "Failed to create Paystack recipient" });
    }

    const newTransaction = {
      source: "balance",
      amount,
      reference: `txn-${Date.now()}`,
      recipient: recipientResponse.data.data.recipient_code,
      reason: "Withdrawal request",
    };

    // Initiate transfer
    const transferResponse = await axios.post(
      `https://api.paystack.co/transfer`,
      newTransaction,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    // Check for transfer response errors
    if (transferResponse.data.status === false) {
      const errorMessage = transferResponse.data.message;

      // Handle specific error for starter businesses
      if (transferResponse.data.code === "transfer_unavailable") {
        return res.status(403).json({
          error:
            "Transfer unavailable: You cannot initiate third-party payouts as a starter business.",
        });
      }

      return res.status(500).json({ error: errorMessage });
    }

    // Update wallet balance and log the transaction
    wallet.balance -= amount;

    const transaction = new Transaction({
      walletId: wallet._id,
      amount,
      type: "withdrawal",
      bankName,
      accountNumber,
      bankCode,
      status: "pending",
      paymentMethod: "naira_wallet",
      reference: newTransaction.reference,
    });

    await transaction.save();
    wallet.transactions.push(transaction._id);
    await wallet.save();

    // Update transaction status to completed
    transaction.status = "completed";
    await transaction.save();

    // Respond to the client
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
    console.log(error);

    return res.status(500).json({
      message: "Error withdrawing from wallet",
      error: error.message,
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
      .sort({ transactionDate: -1 })
      .exec();

    const transactionsWithUserDetails = transactions.map((transaction) => ({
      _id: transaction._id,
      reference: transaction.reference,
      amount: transaction.amount,
      type: transaction.type,
      timestamp: transaction.timestamp,
      status: transaction.status,
      user: {
        username: transaction.walletId.userId.username,
        email: transaction.walletId.userId.email,
      },
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
    res.status(500).json({ message: "Error fetching transactions", error });
  }
};

const getTransactionsByUser = async (req, res) => {
  const userId = req.user.id;
  const { type, page = 1, limit = 10, reference } = req.query;

  try {
    const wallet = await Wallet.findOne({ userId: userId });

    if (!wallet) {
      return res.json({
        totalTransactions: 0,
        totalPages: 0,
        currentPage: Number(page),
        transactions: [],
      });
    }

    const filters = {
      walletId: wallet._id,
    };

    if (type) {
      filters.type = type.toLowerCase();
    }

    if (reference) {
      filters.reference = { $regex: reference, $options: 'i' };
    }

    const totalTransactions = await Transaction.countDocuments(filters);
    const totalPages = Math.ceil(totalTransactions / parseInt(limit));

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const transactions = await Transaction.find(filters)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limitNumber)
      .exec();

    res.json({
      totalTransactions,
      totalPages,
      currentPage: pageNumber,
      transactions: transactions,
    });

  } catch (error) {
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

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching banks from Paystack:", error);
    res
      .status(500)
      .json({ message: "Error fetching banks", error: error.message });
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
