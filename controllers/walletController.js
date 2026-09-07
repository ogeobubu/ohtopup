const secureWithdrawals = require('./withdrawalController');
const secureDeposits = require('./depositController');
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
        try {
          wallet = await Wallet.findOneAndUpdate({ userId }, { $setOnInsert: { userId, balance: 0, balanceKobo: 0, isActive: true } }, { upsert: true, new: true, runValidators: true });
        } catch (error) {
          if (error.code !== 11000) throw error;
          wallet = await Wallet.findOne({ userId });
        }
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

const depositWallet = (req, res) => res.status(410).json({
  message: 'Manual deposits are unavailable. Use verified payment checkout.'
});

const depositPaystackWallet = secureDeposits.depositPaystackWallet;

const depositWalletWithPaystack = secureDeposits.depositWalletWithPaystack;

const depositWalletWithMonnify = secureDeposits.depositWalletWithMonnify;

const verifyMonnifyTransaction = secureDeposits.verifyMonnifyTransaction;

const handlePaystackCallback = async (req, res) => {
  const reference = req.query.reference || req.query.trxref;
  const target = new URL('/wallet', process.env.CLIENT_URL);
  if (typeof reference !== 'string') {
    target.searchParams.set('error', 'missing_reference');
    return res.redirect(target.toString());
  }
  target.searchParams.set('reference', reference);
  try {
    const result = await secureDeposits.verifyReference(reference);
    target.searchParams.set('status', result.status);
  } catch {
    target.searchParams.set('error', 'verification_failed');
  }
  return res.redirect(target.toString());
};

const handlePaystackWebhook = async (req, res) => {
  try {
    await require('../services/paymentEventService').ingest(req.rawBody, req.headers['x-paystack-signature'], process.env.PAYSTACK_SECRET_KEY);
    return res.status(200).send('Webhook received');
  } catch (error) {
    return res.status(error.status || 503).json({ message: error.status ? error.message : 'Unable to persist webhook; please retry' });
  }
};

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
  // Reverify with the gateway; metadata supplied by the payer never selects the wallet.
  await secureDeposits.verifyReference(event.data.reference);
};

const handleChargeFailed = async (event) => {
  await Transaction.updateOne({ reference: event.data.reference, type: 'deposit', status: 'pending' },
    { $set: { status: 'failed', gatewayResponse: event.data } });
};

const handleTransferSuccess = event => require('../services/withdrawalService').transition({
  reference: event.data.reference, status: 'completed', allowed: ['processing'], gatewayResponse: event.data
});
const handleTransferFailed = event => require('../services/withdrawalService').transition({
  reference: event.data.reference, status: 'failed', allowed: ['processing'], refund: true,
  reason: 'Gateway confirmed transfer failure', gatewayResponse: event.data
});
const handleTransferReversed = event => require('../services/withdrawalService').transition({
  reference: event.data.reference, status: 'failed', allowed: ['processing', 'completed'], refund: true,
  reason: 'Gateway confirmed transfer reversal', gatewayResponse: event.data
});

const verifyPaystackTransaction = secureDeposits.verifyPaystackTransaction;

const withdrawWallet = secureWithdrawals.request;
const withdrawWalletPaystack = secureWithdrawals.request;
const withdrawMonnifyWallet = secureWithdrawals.request;
const withdrawMonnifyWalletOTP = (req, res) => res.status(410).json({ message: 'Withdrawals now require admin approval; direct OTP transfers are unavailable.' });

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
  const { type, page = 1, limit = 10, reference, status } = req.query;

  try {
    const wallet = await dbService.findWalletByUserId(userId);

    // Get wallet transactions (deposits, withdrawals)
    const walletFilters = {
      walletId: wallet._id,
    };

    if (reference) {
      walletFilters.reference = { $regex: reference, $options: "i" };
    }

    // Add status filter for wallet transactions
    if (status) {
      walletFilters.status = status;
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

    // Add status filter for utility transactions
    if (status) {
      utilityFilters.status = status;
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
      } : null,
      // Check for potential duplicates and reference overlaps
      walletRefs: walletTransactions.map(tx => tx.reference),
      utilityRefs: utilityTransactions.map(tx => tx.requestId),
      overlappingRefs: walletTransactions
        .filter(tx => utilityTransactions.some(utx => utx.requestId === tx.reference))
        .map(tx => tx.reference),
      duplicateWalletRefs: walletTransactions.filter((tx, index, arr) =>
        arr.findIndex(t => t.reference === tx.reference) !== index
      ).map(tx => tx.reference),
      duplicateUtilityRefs: utilityTransactions.filter((tx, index, arr) =>
        arr.findIndex(t => t.requestId === tx.requestId) !== index
      ).map(tx => tx.requestId)
    });

    // Combine and sort all transactions by date, ensuring no duplicates
    // Use reference/requestId as deduplication key, preferring utility transactions over wallet transactions
    const transactionMap = new Map();

    // Add wallet transactions first (lower priority)
    walletTransactions.forEach(tx => {
      const key = tx.reference; // Use reference for deduplication
      if (!transactionMap.has(key)) {
        transactionMap.set(key, {
          ...tx.toJSON(),
          transactionType: 'wallet',
          ...(tx.type === "withdrawal" && {
            bankName: tx.bankName,
            accountNumber: tx.accountNumber,
            bankCode: tx.bankCode,
          }),
        });
      } else {
        console.warn(`Duplicate wallet transaction found with reference: ${key}`);
      }
    });

    // Add utility transactions (higher priority - will override wallet transactions with same reference)
    utilityTransactions.forEach(tx => {
      const key = tx.requestId; // Use requestId as deduplication key
      if (transactionMap.has(key)) {
        console.log(`Utility transaction ${key} overriding existing transaction`);
      }
      transactionMap.set(key, {
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
        ...(tx.token && { token: tx.token }),
        ...(tx.units && { units: tx.units }),
        ...(tx.subscription_type && { subscription_type: tx.subscription_type }),
      });
    });

    // Convert map to array and sort by date
    const allTransactions = Array.from(transactionMap.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
      deduplicationEffective: (walletTransactions.length + utilityTransactions.length) > allTransactions.length,
      duplicatesRemoved: (walletTransactions.length + utilityTransactions.length) - allTransactions.length,
      referenceBasedDeduplication: true,
      utilityTransactionsOverrideWallet: true,
      sampleTransaction: paginatedTransactions[0] ? {
        type: paginatedTransactions[0].type,
        transactionType: paginatedTransactions[0].transactionType,
        product_name: paginatedTransactions[0].product_name,
        status: paginatedTransactions[0].status,
        reference: paginatedTransactions[0].reference
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
const approveWithdrawal = secureWithdrawals.approveWithdrawal;

const rejectWithdrawal = secureWithdrawals.rejectWithdrawal;

const processWithdrawal = secureWithdrawals.processWithdrawal;

const completeWithdrawal = secureWithdrawals.completeWithdrawal;

const failWithdrawal = secureWithdrawals.failWithdrawal;

const retryWithdrawal = secureWithdrawals.retryWithdrawal;

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
  processWebhookEvent,
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
