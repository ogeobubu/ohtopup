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

const buyData = require('./purchaseController').buy('data');

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

const getDataSettings = async (req, res, next) => {
  try {
    const settings = await AirtimeSettings.find({ isActive: true });

    // Separate network and global settings
    const networkSettings = settings.filter(setting => setting.type === 'network');
    const globalSettings = settings.find(setting => setting.type === 'global');

    // Build response with data-specific settings
    const dataSettings = {
      global: {
        minAmount: globalSettings?.settings?.minAmount || 100,
        maxAmount: globalSettings?.settings?.maxAmount || 50000,
        dailyLimit: globalSettings?.settings?.dailyLimit || 100000,
        monthlyLimit: globalSettings?.settings?.monthlyLimit || 500000,
        dataCommissionRate: globalSettings?.settings?.dataCommissionRate || 0,
      },
      networks: {}
    };

    // Add network-specific settings
    networkSettings.forEach(setting => {
      dataSettings.networks[setting.network] = {
        minAmount: setting.settings?.minAmount || dataSettings.global.minAmount,
        maxAmount: setting.settings?.maxAmount || dataSettings.global.maxAmount,
        dataCommissionRate: setting.settings?.dataCommissionRate || dataSettings.global.dataCommissionRate,
      };
    });

    res.status(200).json({
      message: "Data settings retrieved successfully",
      settings: dataSettings
    });
  } catch (error) {
    next({
      status: 500,
      message: "Unable to retrieve data settings"
    });
  }
};

const getDataStats = async (req, res, next) => {
  try {
    // Get data transaction statistics
    const stats = {
      totalTransactions: 0,
      totalAmount: 0,
      todayTransactions: 0,
      todayAmount: 0,
      networkBreakdown: {
        mtn: { transactions: 0, amount: 0 },
        glo: { transactions: 0, amount: 0 },
        airtel: { transactions: 0, amount: 0 },
        '9mobile': { transactions: 0, amount: 0 }
      }
    };

    res.status(200).json({
      message: "Data statistics retrieved successfully",
      stats
    });
  } catch (error) {
    next({
      status: 500,
      message: "Unable to retrieve data statistics"
    });
  }
};

module.exports = {
  buyData,
  getDataVariations,
  getDataSettings,
  getDataStats,
};
