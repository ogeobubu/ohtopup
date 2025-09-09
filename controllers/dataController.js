const validationService = require("../services/validationService");
const dbService = require("../services/dbService");
const walletService = require("../services/walletService");
const vtpassService = require("../services/vtpassService");
const clubkonnectService = require("../services/clubkonnectService");
const transactionService = require("../services/transactionService");
const { Provider, NetworkProvider } = require("../model/Provider");
const AirtimeSettings = require("../model/AirtimeSettings");
const { generateRequestId } = require("../utils");
const { createLog } = require("./systemLogController");
const mongoose = require("mongoose");

const buyData = async (req, res, next) => {
  // Declare variables at function scope to make them available in catch block
  let serviceID, billersCode, variation_code, amount, inputPhone, requestedProvider;
  let user, wallet, provider, request_id, apiResponse, transactionContact;
  let actualServiceId, networkName, selectedPlanForPurchase, dataPlanSize, adjustedAmount, commissionAmount;

  try {
    ({ serviceID, billersCode, variation_code, amount, inputPhone, provider: requestedProvider, transactionPin } =
      validationService.validateDataPurchaseInput(req));

    transactionContact = billersCode;

    user = await dbService.findUserById(req.user.id);
    wallet = await dbService.findWalletByUserId(req.user.id);

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

    // Calculate commission and adjusted amount based on network (will be determined later)
    // We'll calculate this after network determination

    // Select provider - use requested provider or default to active provider
    if (requestedProvider) {
      provider = await Provider.findOne({
        name: requestedProvider,
        isActive: true,
        supportedServices: "data"
      });
    } else {
      // Get default provider or fallback to VTPass
      provider = await Provider.findOne({
        isDefault: true,
        isActive: true,
        supportedServices: "data"
      });

      if (!provider) {
        // Fallback to VTPass if no default provider
        provider = await Provider.findOne({
          name: "vtpass",
          isActive: true,
          supportedServices: "data"
        });
      }
    }

    if (!provider) {
      return next({
        status: 503,
        message: "No active data provider available. Please try again later.",
      });
    }

    // Extract network from variation code and get the correct serviceId
    let networkName;
    let correctServiceId;

    if (provider.name === 'clubkonnect') {
      // For Clubkonnect, first try to look up the plan in selected data plans
      let selectedPlan = null;
      try {
        selectedPlan = await mongoose.connection.db.collection('selecteddataplans').findOne({
          planId: variation_code,
          isActive: true
        });

        if (selectedPlan) {
          networkName = selectedPlan.network.toLowerCase();
          console.log(`Found network from selected plan: ${networkName} for planId: ${variation_code}`);
        }
      } catch (dbError) {
        console.error('Error looking up selected data plan:', dbError.message);
      }

      // If not found in selected plans, try to get network from Clubkonnect API
      if (!networkName) {
        networkName = await getNetworkForClubkonnectPlan(variation_code, provider);
      }

      if (!networkName) {
        return next({
          status: 400,
          message: "Unable to determine network for the selected plan. Please check the selected plan.",
        });
      }
      correctServiceId = await getServiceIdForNetwork(networkName, provider._id);
    } else {
      // For other providers, extract network from variation code
      networkName = extractNetworkFromVariationCode(variation_code);
      if (!networkName) {
        return next({
          status: 400,
          message: "Unable to determine network from variation code. Please check the selected plan.",
        });
      }
      correctServiceId = await getServiceIdForNetwork(networkName, provider._id);
    }

    if (!correctServiceId) {
      // Fallback to default serviceIds if NetworkProvider not found
      if (provider.name === 'vtpass') {
        const defaultVtpassServiceIds = {
          'mtn': 'mtn-data',
          'glo': 'glo-data',
          'airtel': 'airtel-data',
          '9mobile': 'etisalat-data'
        };
        correctServiceId = defaultVtpassServiceIds[networkName];
        console.log(`Using default VTPass serviceId for ${networkName}: ${correctServiceId}`);
      } else if (provider.name === 'clubkonnect') {
        const defaultClubkonnectServiceIds = {
          'mtn': '01',
          'glo': '02',
          'airtel': '04',
          '9mobile': '03'
        };
        correctServiceId = defaultClubkonnectServiceIds[networkName];
        console.log(`Using default Clubkonnect serviceId for ${networkName}: ${correctServiceId}`);
      }

      if (!correctServiceId) {
        return next({
          status: 400,
          message: `Service not configured for ${networkName}. Please contact support.`,
        });
      }
    }

    // Use the correct serviceId from NetworkProvider instead of provider name
    const actualServiceId = correctServiceId;

    // Calculate commission and adjusted amount based on network
    const airtimeSettings = await AirtimeSettings.find({ isActive: true });
    const networkSettings = airtimeSettings.find(setting =>
      setting.type === 'network' && setting.network === networkName
    );
    const globalSettings = airtimeSettings.find(setting => setting.type === 'global');

    const commissionRate = networkSettings?.settings?.dataCommissionRate ||
                          globalSettings?.settings?.dataCommissionRate || 0;
    commissionAmount = (amount * commissionRate) / 100;
    adjustedAmount = amount - commissionAmount;

    console.log('Data Purchase Commission calculation:', {
      originalAmount: amount,
      network: networkName,
      commissionRate: commissionRate,
      commissionAmount: commissionAmount,
      adjustedAmount: adjustedAmount
    });

    // Check wallet balance against adjusted amount
    walletService.checkWalletForDebit(wallet, adjustedAmount);

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

        const apiRequestData = {
          request_id,
          serviceID: actualServiceId, // Use correct serviceId from NetworkProvider
          billersCode,
          variation_code,
          amount: amount.toString(), // VTPass requires amount as string
          phone: billersCode,
        };

        // Add timeout wrapper for VTPass API call
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API request timeout')), 30000); // 30 second timeout
        });

        apiResponse = await Promise.race([
          vtpassService.makePayment(apiRequestData),
          timeoutPromise
        ]);
      } else if (provider.name === 'clubkonnect') {
        clubkonnectService.setProvider(provider);

        // For Clubkonnect, first try to find the plan in selected data plans
        let networkCode = null;

        try {
          selectedPlanForPurchase = await mongoose.connection.db.collection('selecteddataplans').findOne({
            planId: variation_code,
            isActive: true
          });

          if (selectedPlanForPurchase) {
            // Use the network from the selected plan
            const networkName = selectedPlanForPurchase.network.toLowerCase();
            networkCode = mapNetworkToClubkonnect(networkName);
            console.log(`Found plan ${variation_code} with network: ${networkName} (${networkCode})`);
          }
        } catch (dbError) {
          console.error('Error looking up plan for purchase:', dbError.message);
        }

        // If not found in selected plans, try the old method
        if (!networkCode) {
          const extractedNetwork = extractNetworkFromVariationCode(variation_code);
          if (!extractedNetwork) {
            return next({
              status: 400,
              message: "Unable to determine network from variation code. Please check the selected plan.",
            });
          }
          networkCode = mapNetworkToClubkonnect(extractedNetwork);
        }

        // Validate network code
        if (!networkCode || !['01', '02', '03', '04'].includes(networkCode)) {
          return next({
            status: 400,
            message: `Invalid network code for Clubkonnect: ${networkCode}. Supported networks: MTN(01), Glo(02), 9mobile(03), Airtel(04)`,
          });
        }

        // Add timeout wrapper for Clubkonnect API call
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API request timeout')), 30000); // 30 second timeout
        });

        // Extract data plan size from variation_code for Clubkonnect
        // First try to get it from selected data plans, then fall back to extraction

        // Try to get data plan size from selected plans first (use the one we found for purchase)
        if (selectedPlanForPurchase) {
          dataPlanSize = selectedPlanForPurchase.amount?.toString();
          console.log(`Using data plan size from selected plan: ${dataPlanSize} for planId: ${variation_code}`);
        }

        // If not found in selected plans, try to extract from variation code
        if (!dataPlanSize) {
          dataPlanSize = extractDataPlanSize(variation_code);
        }

        if (!dataPlanSize) {
          return next({
            status: 400,
            message: "Unable to determine data plan size from variation code. Please check the selected plan.",
          });
        }

        // Use the PRODUCT_ID from the selected plan as the data plan
        let clubkonnectDataPlan = variation_code; // Default to variation_code

        if (selectedPlanForPurchase) {
          // Extract PRODUCT_ID from dataAmount field
          if (selectedPlanForPurchase.dataAmount) {
            const dataAmountStr = selectedPlanForPurchase.dataAmount;
            // Extract numeric part (e.g., "100.01GB" -> "100.01", "500MB" -> "500")
            const match = dataAmountStr.match(/(\d+(?:\.\d+)?)/);
            if (match) {
              clubkonnectDataPlan = match[1];
              console.log(`Extracted PRODUCT_ID from dataAmount "${dataAmountStr}": ${clubkonnectDataPlan}`);
            } else {
              console.log(`Could not extract PRODUCT_ID from dataAmount: ${dataAmountStr}`);
            }
          } else {
            // Fallback: try to extract from plan name
            const planName = selectedPlanForPurchase.name || selectedPlanForPurchase.displayName || '';
            console.log(`No dataAmount found, using planId as data plan: ${clubkonnectDataPlan} (${planName})`);
          }
        } else {
          console.log(`No selected plan found, using variation_code as data plan: ${clubkonnectDataPlan}`);
        }

        console.log(`Clubkonnect API Call - Network: ${networkName} (${networkCode}), Data Plan: ${clubkonnectDataPlan}, Phone: ${billersCode}`);

        apiResponse = await Promise.race([
          clubkonnectService.purchaseData(
            networkCode,
            clubkonnectDataPlan,
            billersCode,
            request_id
          ),
          timeoutPromise
        ]);
      } else {
        return next({
          status: 400,
          message: `Unsupported provider: ${provider.name}`,
        });
      }
    } catch (apiError) {
      console.log(apiError)
      // Log API error to system logs
      await createLog(
        'error',
        `Data purchase API call failed: ${apiError.message}`,
        'transaction',
        req.user?.id,
        req.user?.email,
        {
          provider: provider.name,
          serviceID: actualServiceId, // Use correct serviceId in logs
          network: networkName,
          requestId: request_id,
          errorType: 'api_call_failed',
          errorStack: apiError.stack,
          billersCode: billersCode.replace(/(\d{3})\d{6}(\d{3})/, '$1******$2') // Mask phone number
        },
        req
      );

      return next({
        status: 502,
        message: 'Payment service temporarily unavailable. Please try again in a few minutes.',
      });
    }

    // Process the API response and create transaction
    // Extract the actual API response data from the service response
    let apiResponseData;
    if (provider.name === 'clubkonnect') {
      // For Clubkonnect, format the response properly for transaction service
      apiResponseData = {
        success: apiResponse.success,
        status: apiResponse.status || 'pending',
        rawResponse: apiResponse.rawResponse
      };
    } else {
      // For other providers, use existing logic
      apiResponseData = apiResponse.success ? apiResponse.data : apiResponse;
    }

    console.log("Data Purchase API Response Data:", JSON.stringify(apiResponse, null, 2));
    console.log("Data Purchase - Provider:", provider.name);
    console.log("Data Purchase - Transaction Type:", 'data');

    const newTransaction = await transactionService.processPaymentApiResponse(
      apiResponseData,
      amount, // Original data plan amount for API
      user._id,
      request_id,
      actualServiceId, // Use correct serviceId for transaction
      transactionContact,
      {
        provider: provider.name,
        network: networkName,
        dataPlan: variation_code,
        dataAmount: selectedPlanForPurchase?.dataAmount || dataPlanSize,
        validity: selectedPlanForPurchase?.validity,
        transactionType: 'data',
        commissionAmount: commissionAmount,
        adjustedAmount: adjustedAmount
      }
    );

    console.log('Data Purchase - Transaction created:', {
      id: newTransaction._id,
      requestId: newTransaction.requestId,
      type: newTransaction.type,
      product_name: newTransaction.product_name,
      status: newTransaction.status,
      amount: newTransaction.amount,
      commissionAmount: commissionAmount,
      adjustedAmount: adjustedAmount
    });

    // Process transaction outcome with adjusted amount for wallet deduction
    let result;
    try {
      result = await transactionService.handlePaymentOutcome(
        newTransaction,
        wallet,
        adjustedAmount, // Use adjusted amount for wallet deduction
        user._id,
        transactionContact
      );

      console.log('Data Purchase - Transaction outcome:', {
        status: result.status,
        message: result.message,
        transactionSaved: !!result.transactionDetails,
        transactionId: result.transactionDetails?.requestId
      });

      if (!result.transactionDetails) {
        console.error('Data Purchase - Transaction outcome failed: No transaction details returned');
      }
    } catch (outcomeError) {
      console.error('Data Purchase - Transaction outcome error:', {
        error: outcomeError.message,
        stack: outcomeError.stack,
        transactionId: newTransaction.requestId
      });
      throw outcomeError; // Re-throw to be handled by error handler
    }

    res.status(result.status).json({
      message: result.message,
      provider: provider.displayName,
      ...(result.transactionDetails && {
        transaction: {
          ...result.transactionDetails,
          provider: provider.name,
          network: networkName,
          dataPlan: variation_code,
          dataAmount: selectedPlanForPurchase?.dataAmount || dataPlanSize,
          validity: selectedPlanForPurchase?.validity,
          transactionType: 'data'
        },
      }),
      ...(result.newBalance !== undefined && { newBalance: result.newBalance }),
    });

  } catch (err) {
    console.log(err);
    // Log any unexpected errors in data purchase
    await createLog(
      'error',
      `Unexpected error in data purchase: ${err.message}`,
      'transaction',
      req.user?.id,
      req.user?.email,
      {
        serviceID: actualServiceId || serviceID, // Use correct serviceId if available
        network: networkName,
        requestId: request_id,
        provider: provider?.name,
        amount,
        errorType: 'unexpected_error',
        errorStack: err.stack,
        billersCode: billersCode?.replace(/(\d{3})\d{6}(\d{3})/, '$1******$2') // Mask phone number
      },
      req
    );

    next(err);
  }
};

// Helper function to extract network from variation code
const extractNetworkFromVariationCode = (variationCode) => {
  if (!variationCode) return null;

  // Extract network from variation code (e.g., "mtn-10mb-100" -> "mtn")
  const network = variationCode.split('-')[0]?.toLowerCase();

  // Handle special cases where network name is embedded differently
  if (variationCode.toLowerCase().startsWith('glo') && variationCode.length > 3) {
    return 'glo';
  }

  // Map common variations and abbreviations
  const networkMap = {
    'mtn': 'mtn',
    'glo': 'glo',
    'airt': 'airtel', // Map "airt" to "airtel"
    'airtel': 'airtel',
    'etisalat': '9mobile', // etisalat is now 9mobile
    '9mobile': '9mobile',
    'dstv': 'dstv',
    'gotv': 'gotv',
    'startimes': 'startimes'
  };

  return networkMap[network] || network;
};

// Helper function to get serviceId for a network
const getServiceIdForNetwork = async (networkName, providerId) => {
  try {
    const networkProvider = await NetworkProvider.findOne({
      name: networkName,
      provider: providerId,
      serviceType: 'data',
      isActive: true
    });

    return networkProvider?.serviceId || null;
  } catch (error) {
    console.error('Error finding network provider:', error);
    return null;
  }
};

// Helper function to get network for Clubkonnect plan by product code
const getNetworkForClubkonnectPlan = async (productCode, provider) => {
  try {
    const clubkonnectService = require("../services/clubkonnectService");
    clubkonnectService.setProvider(provider);

    const result = await clubkonnectService.getDataPlans();
    if (result.success) {
      const plan = result.plans.find(p => p.productCode === productCode);
      return plan?.network?.toLowerCase() || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting network for Clubkonnect plan:', error);
    return null;
  }
};

// Helper function to extract data plan size from variation code for Clubkonnect
const extractDataPlanSize = (variationCode) => {
  if (!variationCode) return null;

  console.log(`Extracting data plan size from: ${variationCode}`);

  // Extract the last part which should be the data size in MB
  // Format examples: "mtn-1gb-1000" -> "1000", "glo-500mb-500" -> "500"
  const parts = variationCode.split('-');
  const lastPart = parts[parts.length - 1];

  // Check if it's a numeric value (data size in MB)
  const numericValue = parseInt(lastPart);
  if (!isNaN(numericValue) && numericValue > 0) {
    console.log(`Extracted data plan size: ${numericValue}MB`);
    return numericValue.toString(); // Return as string for API
  }

  // Try to find patterns like "500MB", "1GB", etc.
  const sizeMatch = variationCode.match(/(\d+(?:\.\d+)?)\s*(MB|GB|mb|gb)/i);
  if (sizeMatch) {
    const size = parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2].toUpperCase();

    if (unit === 'GB') {
      const mbValue = Math.round(size * 1000); // Convert GB to MB
      console.log(`Converted ${size}GB to ${mbValue}MB`);
      return mbValue.toString();
    } else if (unit === 'MB') {
      console.log(`Extracted data plan size: ${size}MB`);
      return Math.round(size).toString();
    }
  }

  // Fallback: try to find any numeric value in the variation code
  const match = variationCode.match(/(\d+)/);
  if (match) {
    const fallbackValue = parseInt(match[1]);
    console.log(`Fallback data plan size extraction: ${fallbackValue}`);
    return fallbackValue.toString();
  }

  console.log(`Failed to extract data plan size from: ${variationCode}`);
  return null;
};

// Helper function to map network codes for Clubkonnect
const mapNetworkToClubkonnect = (networkCode) => {
  const networkMap = {
    "mtn": "01",
    "glo": "02",
    "etisalat": "03",
    "airtel": "04",
    "01": "01", // MTN
    "02": "02", // Glo
    "03": "03", // Etisalat
    "04": "04", // Airtel
  };

  return networkMap[networkCode] || networkCode;
};

// Helper function to convert data amount to simple Clubkonnect format
const convertDataAmountToSimpleFormat = (dataAmountStr) => {
  try {
    if (!dataAmountStr) return null;

    // Handle formats like "100.01GB", "500MB", "1.5GB", etc.
    const match = dataAmountStr.toUpperCase().match(/(\d+(?:\.\d+)?)\s*(GB|MB)/);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2];

      if (unit === 'GB') {
        // Convert GB to simple format (1GB = 1000)
        return Math.round(value * 1000).toString();
      } else if (unit === 'MB') {
        // MB stays as-is
        return Math.round(value).toString();
      }
    }

    // If no unit found, assume it's already a simple number
    const numericValue = parseFloat(dataAmountStr);
    if (!isNaN(numericValue)) {
      return Math.round(numericValue).toString();
    }

    return dataAmountStr; // Return as-is if can't parse
  } catch (error) {
    console.error('Error converting data amount format:', error);
    return dataAmountStr;
  }
};

// Get data variations/plans from active provider
const getDataVariations = async (req, res, next) => {
  try {
    const { serviceID } = req.query;

    // Get the active provider
    const provider = await Provider.findOne({
      isActive: true,
      supportedServices: "data"
    });

    if (!provider) {
      return res.status(404).json({
        message: "No active data provider found"
      });
    }

    // If serviceID is provided, try to find the correct NetworkProvider
    let actualServiceId = serviceID;
    if (serviceID) {
      const networkName = extractNetworkFromVariationCode(serviceID) || serviceID;
      const networkProvider = await NetworkProvider.findOne({
        name: networkName,
        provider: provider._id,
        serviceType: 'data',
        isActive: true
      });

      if (networkProvider) {
        actualServiceId = networkProvider.serviceId;
      }
    }

    let variations = [];

    if (provider.name === 'vtpass') {
      vtpassService.setProvider(provider);

      const result = await vtpassService.getServiceVariations(serviceID);

      if (result.success) {
        variations = result.variations.map(variation => ({
          variation_code: variation.variation_code,
          name: variation.name,
          variation_amount: variation.variation_amount,
          fixedPrice: variation.fixedPrice || "0",
          variation_code_slug: variation.variation_code_slug || variation.variation_code,
        }));
      }
    } else if (provider.name === 'clubkonnect') {
      clubkonnectService.setProvider(provider);

      const result = await clubkonnectService.getDataPlans();

      if (result.success) {
        // Filter plans by network if serviceID is provided
        const filteredPlans = serviceID
          ? result.plans.filter(plan => plan.networkId === serviceID)
          : result.plans;

        variations = filteredPlans.map(plan => ({
          variation_code: plan.productCode,
          name: plan.name,
          variation_amount: plan.amount.toString(),
          fixedPrice: plan.amount.toString(),
          variation_code_slug: plan.productCode,
          dataAmount: plan.dataAmount,
          validity: plan.validity,
          type: plan.type,
          network: plan.network,
        }));
      }
    }

    res.status(200).json({
      message: "Data variations retrieved successfully",
      variations,
      provider: {
        name: provider.name,
        displayName: provider.displayName
      }
    });

  } catch (error) {
    // Log error to system logs
    await createLog(
      'error',
      `Failed to fetch data variations: ${error.message}`,
      'api',
      req.user?.id,
      req.user?.email,
      {
        serviceID,
        provider: provider?.name,
        errorType: 'fetch_variations_failed',
        errorStack: error.stack
      },
      req
    );

    next({
      status: 500,
      message: "Unable to load data plans at this time. Please try again later."
    });
  }
};

module.exports = {
  buyData,
  getDataVariations,
};
