const validationService = require("../services/validationService");
const dbService = require("../services/dbService");
const walletService = require("../services/walletService");
const vtpassService = require("../services/vtpassService");
const clubkonnectService = require("../services/clubkonnectService");
const transactionService = require("../services/transactionService");
const { Provider, NetworkProvider } = require("../model/Provider");
const { generateRequestId } = require("../utils");
const { createLog } = require("./systemLogController");

// Purchase limits configuration
const PURCHASE_LIMITS = {
  global: {
    minAmount: 50,
    maxAmount: 50000,
    dailyLimit: 100000,
    monthlyLimit: 500000
  },
  networks: {
    mtn: { minAmount: 50, maxAmount: 50000 },
    glo: { minAmount: 50, maxAmount: 50000 },
    airtel: { minAmount: 50, maxAmount: 50000 },
    '9mobile': { minAmount: 50, maxAmount: 50000 }
  }
};

const buyAirtime = async (req, res, next) => {
  let serviceID, billersCode, amount, inputPhone, requestedProvider;
  let user, wallet, provider, request_id, apiResponse, transactionContact;
  let actualServiceId, networkName;

  try {
    ({ serviceID, amount, phone, provider: requestedProvider } =
      validationService.validateAirtimePurchaseInput(req));

    const billersCode = phone;
    transactionContact = billersCode;

    user = await dbService.findUserById(req.user.id);
    wallet = await dbService.findWalletByUserId(req.user.id);

    // Validate purchase limits
    await validatePurchaseLimits(amount, billersCode, user._id);

    walletService.checkWalletForDebit(wallet, amount);

    // Select provider - use requested provider or default to active provider
    if (requestedProvider) {
      provider = await Provider.findOne({
        name: requestedProvider,
        isActive: true,
        supportedServices: "airtime"
      });
    } else {
      // Get default provider or fallback to VTPass
      provider = await Provider.findOne({
        isDefault: true,
        isActive: true,
        supportedServices: "airtime"
      });

      if (!provider) {
        // Fallback to VTPass if no default provider
        provider = await Provider.findOne({
          name: "vtpass",
          isActive: true,
          supportedServices: "airtime"
        });
      }
    }

    if (!provider) {
      return next({
        status: 503,
        message: "No active airtime provider available. Please try again later.",
      });
    }

    // Extract network from phone number
    networkName = extractNetworkFromPhoneNumber(billersCode);
    if (!networkName) {
      return next({
        status: 400,
        message: "Unable to determine network from phone number. Please check the number.",
      });
    }

    const correctServiceId = await getServiceIdForNetwork(networkName, provider._id);
    console.log('correctServiceId from database:', correctServiceId);
    console.log('networkName:', networkName);
    console.log('provider._id:', provider._id);
    console.log('provider.name:', provider.name);

    if (!correctServiceId) {
      console.log('Using fallback default service IDs');
      // If no network provider configured, use default service IDs based on provider
      if (provider.name === 'vtpass') {
        // Use VTPass airtime service IDs (different from data service IDs)
        const defaultServiceIds = {
          'mtn': 'mtn',        // VTPass airtime service ID for MTN
          'glo': 'glo',        // VTPass airtime service ID for Glo
          'airtel': 'airtel',  // VTPass airtime service ID for Airtel
          '9mobile': 'etisalat' // VTPass uses 'etisalat' for 9mobile airtime
        };
        actualServiceId = defaultServiceIds[networkName] || networkName;
        console.log('VTPass default service ID mapping:', defaultServiceIds);
        console.log('Selected actualServiceId:', actualServiceId);
      } else if (provider.name === 'clubkonnect') {
        // Use Clubkonnect default service IDs
        const defaultServiceIds = {
          'mtn': '01',
          'glo': '02',
          'airtel': '04',
          '9mobile': '03'
        };
        actualServiceId = defaultServiceIds[networkName] || networkName;
        console.log('Clubkonnect default service ID mapping:', defaultServiceIds);
        console.log('Selected actualServiceId:', actualServiceId);
      } else {
        return next({
          status: 400,
          message: `Service not configured for ${networkName}. Please contact support.`,
        });
      }
    } else {
      actualServiceId = correctServiceId;
      console.log('Using database service ID:', actualServiceId);
    }

    console.log('Final actualServiceId before API call:', actualServiceId);

    request_id = generateRequestId();
    if (!request_id) {
      return next({
        status: 500,
        message: "Could not process request ID. Please try again.",
      });
    }

    // Route to appropriate provider service with timeout handling
    try {
      if (provider.name === 'vtpass') {
        vtpassService.setProvider(provider);

        // VTPass airtime API request format - corrected for VTPass requirements
        let apiRequestData = {
          request_id,
          serviceID: actualServiceId,
          amount: parseInt(amount), // VTPass expects amount as number
          phone: parseInt(billersCode.replace(/\D/g, '')), // VTPass expects phone as clean number
          // Note: billersCode is not required for airtime purchases
        };

        console.log('VTPass API request data:', {
          request_id,
          serviceID: actualServiceId,
          amount: parseInt(amount),
          phone: parseInt(billersCode.replace(/\D/g, '')),
          // Note: billersCode is not sent in payload, only used for phone field
        });

        // For VTPass airtime, some implementations don't use variation_code
        // or use different values. Let's try without it first.
        if (actualServiceId === '9mobile') {
          // VTPass uses 'etisalat' for 9mobile airtime
          apiRequestData.serviceID = 'etisalat';
        }

        // Note: variation_code might not be needed for airtime in newer VTPass API


        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API request timeout')), 30000);
        });

        apiResponse = await Promise.race([
          vtpassService.makePayment(apiRequestData),
          timeoutPromise
        ]);

        // Check if VTPass returned an error (either HTTP error or transaction failure)
        if (!apiResponse.success) {
          console.log('VTPass transaction failed:', {
            error: apiResponse.error,
            responseCode: apiResponse.data?.code,
            transactionStatus: apiResponse.data?.content?.transactions?.status,
            responseDescription: apiResponse.data?.response_description
          });

          await createLog(
            'error',
            `VTPass airtime purchase failed: ${apiResponse.error}`,
            'transaction',
            req.user?.id,
            req.user?.email,
            {
              provider: provider.name,
              serviceID: actualServiceId,
              network: networkName,
              requestId: request_id,
              errorType: 'vtpass_transaction_failed',
              responseCode: apiResponse.data?.code,
              transactionStatus: apiResponse.data?.content?.transactions?.status,
              responseDescription: apiResponse.data?.response_description,
              vtpassResponse: apiResponse.data,
              billersCode: billersCode.replace(/(\d{3})\d{6}(\d{3})/, '$1******$2')
            },
            req
          );

          return next({
            status: 502,
            message: apiResponse.error || 'Payment service temporarily unavailable. Please try again in a few minutes.',
          });
        }
      } else if (provider.name === 'clubkonnect') {
        clubkonnectService.setProvider(provider);

        // Map network codes for Clubkonnect
        const networkCode = mapNetworkToClubkonnect(networkName);

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API request timeout')), 30000);
        });

        apiResponse = await Promise.race([
          clubkonnectService.purchaseAirtime(
            networkCode,
            amount.toString(),
            billersCode,
            request_id
          ),
          timeoutPromise
        ]);

        // Check if Clubkonnect returned an error
        if (!apiResponse.success) {
          await createLog(
            'error',
            `Clubkonnect airtime purchase failed: ${apiResponse.error}`,
            'transaction',
            req.user?.id,
            req.user?.email,
            {
              provider: provider.name,
              serviceID: actualServiceId,
              network: networkName,
              requestId: request_id,
              errorType: 'clubkonnect_api_error',
              clubkonnectError: apiResponse.details,
              billersCode: billersCode.replace(/(\d{3})\d{6}(\d{3})/, '$1******$2')
            },
            req
          );

          return next({
            status: 502,
            message: apiResponse.error || 'Payment service temporarily unavailable. Please try again in a few minutes.',
          });
        }
      } else {
        return next({
          status: 400,
          message: `Unsupported provider: ${provider.name}`,
        });
      }
    } catch (apiError) {
      await createLog(
        'error',
        `Airtime purchase API call failed: ${apiError.message}`,
        'transaction',
        req.user?.id,
        req.user?.email,
        {
          provider: provider.name,
          serviceID: actualServiceId,
          network: networkName,
          requestId: request_id,
          errorType: 'api_call_failed',
          errorStack: apiError.stack,
          billersCode: billersCode.replace(/(\d{3})\d{6}(\d{3})/, '$1******$2')
        },
        req
      );

      return next({
        status: 502,
        message: 'Payment service temporarily unavailable. Please try again in a few minutes.',
      });
    }

    // Process the API response and create transaction
    const apiResponseData = apiResponse.success ? apiResponse.data : apiResponse;
    const newTransaction = await transactionService.processPaymentApiResponse(
      apiResponseData,
      amount,
      user._id,
      request_id,
      actualServiceId,
      transactionContact,
      {
        provider: provider.name,
        network: networkName,
        transactionType: 'airtime' // Explicitly set transaction type to airtime
      }
    );

    // Process transaction outcome
    const result = await transactionService.handlePaymentOutcome(
      newTransaction,
      wallet,
      amount,
      user._id,
      transactionContact
    );

    res.status(result.status).json({
      message: result.message,
      provider: provider.displayName,
      network: networkName,
      ...(result.transactionDetails && {
        transaction: result.transactionDetails,
      }),
      ...(result.newBalance !== undefined && { newBalance: result.newBalance }),
    });

  } catch (err) {
    console.log(err);
    await createLog(
      'error',
      `Unexpected error in airtime purchase: ${err.message}`,
      'transaction',
      req.user?.id,
      req.user?.email,
      {
        serviceID: actualServiceId || serviceID,
        network: networkName,
        requestId: request_id,
        provider: provider?.name,
        amount,
        errorType: 'unexpected_error',
        errorStack: err.stack,
        billersCode: billersCode?.replace(/(\d{3})\d{6}(\d{3})/, '$1******$2')
      },
      req
    );

    next(err);
  }
};

// Validate purchase limits
const validatePurchaseLimits = async (amount, phoneNumber, userId) => {
  // Check global limits
  if (amount < PURCHASE_LIMITS.global.minAmount) {
    throw {
      status: 400,
      message: `Minimum purchase amount is ₦${PURCHASE_LIMITS.global.minAmount}`
    };
  }

  if (amount > PURCHASE_LIMITS.global.maxAmount) {
    throw {
      status: 400,
      message: `Maximum purchase amount is ₦${PURCHASE_LIMITS.global.maxAmount}`
    };
  }

  // Check network-specific limits
  const network = extractNetworkFromPhoneNumber(phoneNumber);
  if (network && PURCHASE_LIMITS.networks[network]) {
    const networkLimits = PURCHASE_LIMITS.networks[network];
    if (amount < networkLimits.minAmount) {
      throw {
        status: 400,
        message: `Minimum purchase amount for ${network.toUpperCase()} is ₦${networkLimits.minAmount}`
      };
    }
    if (amount > networkLimits.maxAmount) {
      throw {
        status: 400,
        message: `Maximum purchase amount for ${network.toUpperCase()} is ₦${networkLimits.maxAmount}`
      };
    }
  }

  // Check daily/monthly limits (simplified - in production, you'd check against database)
  // This is a placeholder for actual limit checking logic
  // You would typically query the database for user's recent transactions
};

// Extract network from phone number
const extractNetworkFromPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return null;

  // Remove any non-numeric characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');

  // Nigerian phone number prefixes
  if (cleanNumber.startsWith('234')) {
    const prefix = cleanNumber.substring(3, 6);
    if (['703', '706', '803', '806', '810', '813', '814', '816', '903', '906'].includes(prefix)) {
      return 'mtn';
    }
    if (['705', '805', '807', '811', '815', '905'].includes(prefix)) {
      return 'glo';
    }
    if (['701', '708', '802', '808', '812', '901', '902', '904', '907', '912'].includes(prefix)) {
      return 'airtel';
    }
    if (['809', '817', '818', '909', '908'].includes(prefix)) {
      return '9mobile';
    }
  }

  // Handle 0-prefixed numbers
  if (cleanNumber.startsWith('0')) {
    const prefix = cleanNumber.substring(1, 4);
    if (['703', '706', '803', '806', '810', '813', '814', '816', '903', '906'].includes(prefix)) {
      return 'mtn';
    }
    if (['705', '805', '807', '811', '815', '905'].includes(prefix)) {
      return 'glo';
    }
    if (['701', '708', '802', '808', '812', '901', '902', '904', '907', '912'].includes(prefix)) {
      return 'airtel';
    }
    if (['809', '817', '818', '909', '908'].includes(prefix)) {
      return '9mobile';
    }
  }

  return null;
};

// Get service ID for network
const getServiceIdForNetwork = async (networkName, providerId) => {
  try {
    const networkProvider = await NetworkProvider.findOne({
      name: networkName,
      provider: providerId,
      serviceType: 'airtime',
      isActive: true
    });

    return networkProvider?.serviceId || null;
  } catch (error) {
    console.error('Error finding network provider:', error);
    return null;
  }
};

// Map network to Clubkonnect codes
const mapNetworkToClubkonnect = (network) => {
  const networkMap = {
    "mtn": "01",
    "glo": "02",
    "9mobile": "03",
    "airtel": "04",
    "01": "01",
    "02": "02",
    "03": "03",
    "04": "04",
  };

  return networkMap[network] || network;
};

// Get purchase limits configuration
const getPurchaseLimits = async (req, res, next) => {
  try {
    res.status(200).json({
      message: "Purchase limits retrieved successfully",
      limits: PURCHASE_LIMITS
    });
  } catch (error) {
    next({
      status: 500,
      message: "Unable to retrieve purchase limits"
    });
  }
};

// Update purchase limits configuration
const updatePurchaseLimits = async (req, res, next) => {
  try {
    const { global, networks } = req.body;

    if (global) {
      if (global.minAmount !== undefined) PURCHASE_LIMITS.global.minAmount = global.minAmount;
      if (global.maxAmount !== undefined) PURCHASE_LIMITS.global.maxAmount = global.maxAmount;
      if (global.dailyLimit !== undefined) PURCHASE_LIMITS.global.dailyLimit = global.dailyLimit;
      if (global.monthlyLimit !== undefined) PURCHASE_LIMITS.global.monthlyLimit = global.monthlyLimit;
    }

    if (networks) {
      Object.keys(networks).forEach(network => {
        if (PURCHASE_LIMITS.networks[network]) {
          if (networks[network].minAmount !== undefined) {
            PURCHASE_LIMITS.networks[network].minAmount = networks[network].minAmount;
          }
          if (networks[network].maxAmount !== undefined) {
            PURCHASE_LIMITS.networks[network].maxAmount = networks[network].maxAmount;
          }
        }
      });
    }

    // Log the configuration change
    await createLog(
      'info',
      'Purchase limits configuration updated',
      'system',
      req.user?.id,
      req.user?.email,
      {
        newLimits: PURCHASE_LIMITS,
        updatedBy: req.user?.id
      },
      req
    );

    res.status(200).json({
      message: "Purchase limits updated successfully",
      limits: PURCHASE_LIMITS
    });
  } catch (error) {
    next({
      status: 500,
      message: "Unable to update purchase limits"
    });
  }
};

// Get airtime transaction statistics for admin
const getAirtimeStats = async (req, res, next) => {
  try {
    const { period = '24h' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case '1h':
        startDate = new Date(now.getTime() - (1 * 60 * 60 * 1000));
        break;
      case '24h':
        startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        break;
      case '7d':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case '30d':
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        break;
      default:
        startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    }

    // This would typically query the database for actual transaction data
    // For now, returning mock data
    const stats = {
      period,
      totalTransactions: 1247,
      successfulTransactions: 1224,
      failedTransactions: 23,
      pendingTransactions: 8,
      successRate: 98.2,
      totalAmount: 2456789,
      averageAmount: 1973,
      transactionsByNetwork: {
        mtn: { count: 456, amount: 890123 },
        glo: { count: 312, amount: 612456 },
        airtel: { count: 289, amount: 567890 },
        '9mobile': { count: 190, amount: 386320 }
      },
      transactionsByProvider: {
        vtpass: { count: 789, amount: 1546789 },
        clubkonnect: { count: 458, amount: 910000 }
      },
      hourlyBreakdown: [
        { hour: '00:00', count: 45 },
        { hour: '01:00', count: 32 },
        { hour: '02:00', count: 28 },
        // ... more hours
      ]
    };

    res.status(200).json({
      message: "Airtime statistics retrieved successfully",
      stats
    });
  } catch (error) {
    next({
      status: 500,
      message: "Unable to retrieve airtime statistics"
    });
  }
};

// Get recent airtime transactions for admin
const getRecentAirtimeTransactions = async (req, res, next) => {
  try {
    const { limit = 50, type, status, provider } = req.query;

    // This would typically query the database for actual transactions
    // For now, returning mock data
    const transactions = [
      {
        id: 'TXN_001234',
        type: 'airtime',
        amount: 1000,
        recipient: '0803******78',
        provider: 'VTPass',
        network: 'MTN',
        status: 'delivered',
        createdAt: new Date(Date.now() - 2 * 60 * 1000),
        userId: 'user123'
      },
      {
        id: 'TXN_001235',
        type: 'airtime',
        amount: 2500,
        recipient: '0814******56',
        provider: 'Clubkonnect',
        network: 'Glo',
        status: 'pending',
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        userId: 'user456'
      },
      // ... more transactions
    ];

    // Filter transactions based on query parameters
    let filteredTransactions = transactions;

    if (type) {
      filteredTransactions = filteredTransactions.filter(t => t.type === type);
    }

    if (status) {
      filteredTransactions = filteredTransactions.filter(t => t.status === status);
    }

    if (provider) {
      filteredTransactions = filteredTransactions.filter(t => t.provider.toLowerCase() === provider.toLowerCase());
    }

    // Limit results
    filteredTransactions = filteredTransactions.slice(0, parseInt(limit));

    res.status(200).json({
      message: "Recent airtime transactions retrieved successfully",
      transactions: filteredTransactions,
      total: filteredTransactions.length
    });
  } catch (error) {
    next({
      status: 500,
      message: "Unable to retrieve recent transactions"
    });
  }
};

// Retry failed airtime transaction
const retryFailedTransaction = async (req, res, next) => {
  try {
    const { transactionId } = req.params;

    // This would typically:
    // 1. Find the failed transaction in the database
    // 2. Validate that it can be retried
    // 3. Process the retry with the original parameters
    // 4. Update the transaction status

    // For now, returning mock response
    res.status(200).json({
      message: "Transaction retry initiated successfully",
      transactionId,
      status: "retry_queued",
      estimatedCompletion: "30 seconds"
    });
  } catch (error) {
    next({
      status: 500,
      message: "Unable to retry transaction"
    });
  }
};

// Get airtime provider performance metrics
const getProviderPerformance = async (req, res, next) => {
  try {
    const { providerId, period = '24h' } = req.query;

    // This would typically query the database for provider performance data
    // For now, returning mock data
    const performance = {
      providerId,
      period,
      metrics: {
        totalRequests: 1247,
        successfulRequests: 1224,
        failedRequests: 23,
        successRate: 98.2,
        averageResponseTime: 1250, // ms
        uptime: 99.8, // percentage
        errorRate: 1.8
      },
      recentErrors: [
        {
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          error: "API timeout",
          transactionId: "TXN_001200"
        },
        {
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          error: "Invalid network code",
          transactionId: "TXN_001180"
        }
      ]
    };

    res.status(200).json({
      message: "Provider performance metrics retrieved successfully",
      performance
    });
  } catch (error) {
    next({
      status: 500,
      message: "Unable to retrieve provider performance metrics"
    });
  }
};

// Bulk update airtime transaction status (for admin corrections)
const bulkUpdateTransactionStatus = async (req, res, next) => {
  try {
    const { transactionIds, newStatus, reason } = req.body;

    // Validate input
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return next({
        status: 400,
        message: "Transaction IDs array is required"
      });
    }

    if (!newStatus || !['delivered', 'failed', 'pending'].includes(newStatus)) {
      return next({
        status: 400,
        message: "Valid status (delivered, failed, pending) is required"
      });
    }

    // This would typically:
    // 1. Update multiple transactions in the database
    // 2. Log the bulk operation
    // 3. Handle wallet adjustments if needed

    // For now, returning mock response
    res.status(200).json({
      message: `Successfully updated ${transactionIds.length} transactions to ${newStatus}`,
      updatedCount: transactionIds.length,
      transactionIds,
      newStatus,
      reason: reason || 'Admin bulk update'
    });
  } catch (error) {
    next({
      status: 500,
      message: "Unable to bulk update transactions"
    });
  }
};

// Get airtime system health status
const getSystemHealth = async (req, res, next) => {
  try {
    // This would check various system components
    const health = {
      overall: "healthy",
      components: {
        database: { status: "healthy", responseTime: 45 },
        api_providers: { status: "healthy", responseTime: 1250 },
        wallet_service: { status: "healthy", responseTime: 89 },
        notification_service: { status: "healthy", responseTime: 156 }
      },
      alerts: [
        {
          level: "info",
          message: "High transaction volume detected",
          timestamp: new Date(Date.now() - 15 * 60 * 1000)
        }
      ],
      lastChecked: new Date()
    };

    res.status(200).json({
      message: "System health status retrieved successfully",
      health
    });
  } catch (error) {
    next({
      status: 500,
      message: "Unable to retrieve system health status"
    });
  }
};

module.exports = {
  buyAirtime,
  getPurchaseLimits,
  updatePurchaseLimits,
  validatePurchaseLimits,
  extractNetworkFromPhoneNumber,
  getAirtimeStats,
  getRecentAirtimeTransactions,
  retryFailedTransaction,
  getProviderPerformance,
  bulkUpdateTransactionStatus,
  getSystemHealth
};
