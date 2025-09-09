require("dotenv").config()
const { Provider, NetworkProvider } = require("../model/Provider");
const vtpassService = require("../services/vtpassService");
const clubkonnectService = require("../services/clubkonnectService");
const { createLog } = require("./systemLogController");

// Get all providers
const getAllProviders = async (req, res) => {
  try {
    const providers = await Provider.find({})
      .select('-credentials.apiKey -credentials.secretKey -credentials.publicKey')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Providers retrieved successfully",
      providers
    });
  } catch (error) {
    console.error("Error fetching providers:", error);
    res.status(500).json({ message: "Error fetching providers" });
  }
};

// Get provider by ID
const getProviderById = async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await Provider.findById(id);

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    res.status(200).json({
      message: "Provider retrieved successfully",
      provider
    });
  } catch (error) {
    console.error("Error fetching provider:", error);
    res.status(500).json({ message: "Error fetching provider" });
  }
};

// Create new provider
const createProvider = async (req, res) => {
  try {
    const providerData = req.body;

    // Validate required fields
    if (!providerData.name || !providerData.displayName || !providerData.credentials) {
      return res.status(400).json({
        message: "Name, display name, and credentials are required"
      });
    }

    // Check if provider with this name already exists
    const existingProvider = await Provider.findOne({ name: providerData.name });
    if (existingProvider) {
      return res.status(400).json({
        message: `Provider with name '${providerData.name}' already exists`
      });
    }

    // Set default endpoints based on provider type
    if (providerData.name === 'vtpass') {
      providerData.endpoints = {
        walletBalance: '/api/balance',
        dataPurchase: '/api/pay',
        airtimePurchase: '/api/pay',
        cablePurchase: '/api/pay',
        electricityPurchase: '/api/pay',
        queryTransaction: '/api/requery',
        dataPlans: '/api/service-variations',
        serviceVariations: '/api/service-variations'
      };
      providerData.baseUrl = process.env.VTPASS_URL || 'https://sandbox.vtpass.com';
    } else if (providerData.name === 'clubkonnect') {
      providerData.endpoints = {
        walletBalance: '/APIWalletBalanceV1.asp',
        dataPurchase: '/APIDatabundleV1.asp',
        airtimePurchase: '/APIAirtimeV1.asp', // Assuming similar pattern
        queryTransaction: '/APIQueryV1.asp',
        cancelTransaction: '/APICancelV1.asp'
      };
      providerData.baseUrl = 'https://www.nellobytesystems.com';
    }

    const provider = new Provider(providerData);
    await provider.save();

    res.status(201).json({
      message: "Provider created successfully",
      provider
    });
  } catch (error) {
    console.error("Error creating provider:", error);
    res.status(500).json({ message: "Error creating provider" });
  }
};

// Update provider
const updateProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const provider = await Provider.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    res.status(200).json({
      message: "Provider updated successfully",
      provider
    });
  } catch (error) {
    console.error("Error updating provider:", error);
    res.status(500).json({ message: "Error updating provider" });
  }
};

// Delete provider
const deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await Provider.findByIdAndDelete(id);

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    res.status(200).json({
      message: "Provider deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting provider:", error);
    res.status(500).json({ message: "Error deleting provider" });
  }
};

// Set default provider
const setDefaultProvider = async (req, res) => {
  try {
    const { id } = req.params;

    // First, unset all default providers
    await Provider.updateMany({}, { isDefault: false });

    // Then set the specified provider as default
    const provider = await Provider.findByIdAndUpdate(
      id,
      { isDefault: true },
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    res.status(200).json({
      message: "Default provider set successfully",
      provider
    });
  } catch (error) {
    console.error("Error setting default provider:", error);
    res.status(500).json({ message: "Error setting default provider" });
  }
};

// Get active providers
const getActiveProviders = async (req, res) => {
  try {
    const providers = await Provider.find({ isActive: true })
      .select('name displayName description isDefault healthStatus responseTime successRate')
      .sort({ isDefault: -1, name: 1 });

    res.status(200).json({
      message: "Active providers retrieved successfully",
      providers
    });
  } catch (error) {
    console.error("Error fetching active providers:", error);
    res.status(500).json({ message: "Error fetching active providers" });
  }
};

// Get active airtime network providers for user side
const getActiveAirtimeNetworkProviders = async (req, res) => {
  try {
    // Get the active 3rd party provider that supports airtime
    const activeProvider = await Provider.findOne({
      isActive: true,
      supportedServices: "airtime"
    });

    if (!activeProvider) {
      return res.status(404).json({ message: "No active airtime provider found" });
    }

    // Get network providers for airtime service from the active provider
    const networkProviders = await NetworkProvider.find({
      provider: activeProvider._id,
      serviceType: 'airtime',
      isActive: true
    })
    .populate('provider', 'name displayName')
    .sort({ priority: -1, displayName: 1 });

    // If no network providers configured, return default networks
    if (networkProviders.length === 0) {
      const defaultNetworks = [
        { serviceID: 'mtn', name: 'MTN', description: 'MTN Nigeria' },
        { serviceID: 'glo', name: 'Glo', description: 'Globacom' },
        { serviceID: 'airtel', name: 'Airtel', description: 'Airtel Nigeria' },
        { serviceID: '9mobile', name: '9mobile', description: '9mobile Nigeria' }
      ];

      return res.status(200).json(defaultNetworks);
    }

    // Transform to match the expected format for user-side airtime purchase
    const formattedProviders = networkProviders.map(provider => ({
      serviceID: provider.serviceId || provider.name.toLowerCase(),
      name: provider.displayName,
      description: `${provider.displayName} Airtime Service`,
      minimum_amount: provider.minAmount || 50,
      maximum_amount: provider.maxAmount || 50000,
      image: provider.logo,
      isActive: provider.isActive,
      serviceType: provider.serviceType
    }));

    res.status(200).json(formattedProviders);
  } catch (error) {
    console.error("Error fetching active airtime network providers:", error);
    res.status(500).json({ message: "Error fetching active airtime network providers" });
  }
};

// Get default provider
const getDefaultProvider = async (req, res) => {
  try {
    const provider = await Provider.findOne({ isDefault: true });

    if (!provider) {
      return res.status(404).json({ message: "No default provider found" });
    }

    res.status(200).json({
      message: "Default provider retrieved successfully",
      provider
    });
  } catch (error) {
    console.error("Error fetching default provider:", error);
    res.status(500).json({ message: "Error fetching default provider" });
  }
};

// Test provider connection
const testProviderConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await Provider.findById(id);

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    let testResult = { success: false, message: "Test failed" };

    if (provider.name === 'vtpass') {
      vtpassService.setProvider(provider);
      const result = await vtpassService.checkWalletBalance();
      testResult = {
        success: result.success,
        message: result.success ? "VTPass connection successful" : `VTPass connection failed: ${result.error}`,
        balance: result.balance,
        responseTime: result.responseTime
      };
    } else if (provider.name === 'clubkonnect') {
      clubkonnectService.setProvider(provider);
      const result = await clubkonnectService.checkWalletBalance();
      testResult = {
        success: result.success,
        message: result.success ? "Clubkonnect connection successful" : `Clubkonnect connection failed: ${result.error}`,
        balance: result.balance,
        responseTime: result.responseTime
      };
    }

    res.status(200).json({
      message: "Provider connection test completed",
      testResult
    });
  } catch (error) {
    console.error("Error testing provider connection:", error);
    res.status(500).json({
      message: "Error testing provider connection",
      testResult: { success: false, message: error.message }
    });
  }
};

// Get provider analytics
const getProviderAnalytics = async (req, res) => {
  try {
    const providers = await Provider.find({})
      .select('name displayName healthStatus responseTime successRate totalRequests successfulRequests failedRequests lastHealthCheck')
      .sort({ totalRequests: -1 });

    const analytics = {
      totalProviders: providers.length,
      activeProviders: providers.filter(p => p.healthStatus === 'healthy').length,
      degradedProviders: providers.filter(p => p.healthStatus === 'degraded').length,
      downProviders: providers.filter(p => p.healthStatus === 'down').length,
      providers: providers.map(provider => ({
        name: provider.name,
        displayName: provider.displayName,
        healthStatus: provider.healthStatus,
        responseTime: provider.responseTime,
        successRate: provider.successRate,
        totalRequests: provider.totalRequests,
        successfulRequests: provider.successfulRequests,
        failedRequests: provider.failedRequests,
        lastHealthCheck: provider.lastHealthCheck
      }))
    };

    res.status(200).json({
      message: "Provider analytics retrieved successfully",
      analytics
    });
  } catch (error) {
    console.error("Error fetching provider analytics:", error);
    res.status(500).json({ message: "Error fetching provider analytics" });
  }
};

// Bulk update provider status
const bulkUpdateProviderStatus = async (req, res) => {
  try {
    const { providerIds, isActive } = req.body;

    if (!Array.isArray(providerIds) || providerIds.length === 0) {
      return res.status(400).json({ message: "Provider IDs array is required" });
    }

    const result = await Provider.updateMany(
      { _id: { $in: providerIds } },
      { isActive, updatedAt: new Date() }
    );

    res.status(200).json({
      message: `${result.modifiedCount} providers updated successfully`,
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error bulk updating providers:", error);
    res.status(500).json({ message: "Error bulk updating providers" });
  }
};

const getDataProviders = async (req, res) => {
  try {
    const providers = await Provider.find({
      isActive: true,
      supportedServices: 'data'
    }).select('name displayName description supportedServices isDefault');

    // Transform to match the expected format for data purchase
    const dataProviders = providers.map(provider => ({
      serviceID: provider.name, // Use provider name as serviceID
      name: provider.displayName,
      description: provider.description,
      isDefault: provider.isDefault,
      supportedServices: provider.supportedServices
    }));

    res.status(200).json(dataProviders);
  } catch (error) {
    console.error('Error fetching data providers:', error);
    res.status(500).json({ message: 'Error fetching data providers' });
  }
};

// Network Provider Management Functions
const getAllNetworkProviders = async (req, res) => {
  try {
    const { serviceType, providerId } = req.query;

    let query = {};
    if (serviceType) query.serviceType = serviceType;
    if (providerId) query.provider = providerId;

    const networkProviders = await NetworkProvider.find(query)
      .populate('provider', 'name displayName')
      .sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      message: "Network providers retrieved successfully",
      networkProviders
    });
  } catch (error) {
    console.error("Error fetching network providers:", error);
    res.status(500).json({ message: "Error fetching network providers" });
  }
};

const createNetworkProvider = async (req, res) => {
  try {
    const networkProviderData = req.body;

    // Validate required fields
    if (!networkProviderData.name || !networkProviderData.provider || !networkProviderData.serviceType) {
      return res.status(400).json({
        message: "Name, provider, and service type are required"
      });
    }

    const networkProvider = new NetworkProvider(networkProviderData);
    await networkProvider.save();

    await networkProvider.populate('provider', 'name displayName');

    res.status(201).json({
      message: "Network provider created successfully",
      networkProvider
    });
  } catch (error) {
    console.error("Error creating network provider:", error);
    res.status(500).json({ message: "Error creating network provider" });
  }
};

const updateNetworkProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const networkProvider = await NetworkProvider.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('provider', 'name displayName');

    if (!networkProvider) {
      return res.status(404).json({ message: "Network provider not found" });
    }

    res.status(200).json({
      message: "Network provider updated successfully",
      networkProvider
    });
  } catch (error) {
    console.error("Error updating network provider:", error);
    res.status(500).json({ message: "Error updating network provider" });
  }
};

const deleteNetworkProvider = async (req, res) => {
  try {
    const { id } = req.params;

    const networkProvider = await NetworkProvider.findByIdAndDelete(id);

    if (!networkProvider) {
      return res.status(404).json({ message: "Network provider not found" });
    }

    res.status(200).json({
      message: "Network provider deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting network provider:", error);
    res.status(500).json({ message: "Error deleting network provider" });
  }
};

const toggleNetworkProviderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const networkProvider = await NetworkProvider.findById(id);

    if (!networkProvider) {
      return res.status(404).json({ message: "Network provider not found" });
    }

    networkProvider.isActive = !networkProvider.isActive;
    await networkProvider.save();

    res.status(200).json({
      message: `Network provider ${networkProvider.isActive ? 'activated' : 'deactivated'} successfully`,
      networkProvider
    });
  } catch (error) {
    console.error("Error toggling network provider status:", error);
    res.status(500).json({ message: "Error toggling network provider status" });
  }
};

const getActiveNetworkProviders = async (req, res) => {
  try {
    const { serviceType } = req.query;

    // Get the active 3rd party provider first
    const activeProvider = await Provider.findOne({ isActive: true });

    if (!activeProvider) {
      return res.status(404).json({ message: "No active 3rd party provider found" });
    }

    let query = {
      provider: activeProvider._id,
      isActive: true
    };

    if (serviceType) query.serviceType = serviceType;

    const networkProviders = await NetworkProvider.find(query)
      .populate('provider', 'name displayName')
      .sort({ priority: -1, displayName: 1 });

    // Transform to match the expected format for data purchase
    const formattedProviders = networkProviders.map(provider => ({
      serviceID: provider.serviceId,
      name: provider.displayName,
      description: `${provider.displayName} (${provider.serviceType})`,
      logo: provider.logo,
      isActive: provider.isActive,
      serviceType: provider.serviceType
    }));

    res.status(200).json({
      message: "Active network providers retrieved successfully",
      providers: formattedProviders,
      activeProvider: {
        name: activeProvider.name,
        displayName: activeProvider.displayName
      }
    });
  } catch (error) {
    console.error("Error fetching active network providers:", error);
    res.status(500).json({ message: "Error fetching active network providers" });
  }
};

const setActiveProvider = async (req, res) => {
  try {
    const { providerId } = req.params;

    // First, deactivate all providers
    await Provider.updateMany({}, { isActive: false });

    // Then activate the specified provider
    const provider = await Provider.findByIdAndUpdate(
      providerId,
      { isActive: true },
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    res.status(200).json({
      message: "Active provider set successfully",
      provider
    });
  } catch (error) {
    console.error("Error setting active provider:", error);
    res.status(500).json({ message: "Error setting active provider" });
  }
};

const getActiveProvider = async (req, res) => {
  try {
    const provider = await Provider.findOne({ isActive: true });

    if (!provider) {
      return res.status(404).json({ message: "No active provider found" });
    }

    res.status(200).json({
      message: "Active provider retrieved successfully",
      provider
    });
  } catch (error) {
    console.error("Error fetching active provider:", error);
    res.status(500).json({ message: "Error fetching active provider" });
  }
};

// Get all data plans from all active providers
const getAllDataPlans = async (req, res) => {
  try {
    // Get all active providers that support data
    const providers = await Provider.find({
      isActive: true,
      supportedServices: "data"
    });

    if (!providers || providers.length === 0) {
      return res.status(404).json({
        message: "No active data providers found"
      });
    }

    // Network normalization function
    const normalizeNetwork = (networkValue) => {
      const normalized = networkValue.toLowerCase();
      switch (normalized) {
        case 'mtn':
          return 'MTN';
        case 'airtel':
        case 'airtel':
          return 'Airtel';
        case 'glo':
          return 'Glo';
        case '9mobile':
        case '9_mobile':
        case '9 mobile':
          return '9mobile';
        default:
          return networkValue; // Return as-is if no match
      }
    };

    // Plan type normalization function
    const normalizePlanType = (planTypeValue) => {
      const normalized = planTypeValue.toLowerCase();
      switch (normalized) {
        case 'sme':
          return 'SME';
        case 'regular':
          return 'Regular';
        case 'direct':
          return 'Direct';
        case 'awoof':
          return 'Awoof';
        case 'daily':
          return 'Daily';
        case 'weekly':
          return 'Weekly';
        case 'monthly':
          return 'Monthly';
        default:
          return 'Regular'; // Default to Regular if no match
      }
    };

    const allDataPlans = [];

    // Fetch data plans from each provider
    for (const provider of providers) {
      try {
        let plans = [];

        if (provider.name === 'vtpass') {
          vtpassService.setProvider(provider);

          // Get service variations for common data service IDs
          const serviceIds = ['mtn-data', 'airtel-data', 'glo-data', '9mobile-data'];

          for (const serviceId of serviceIds) {
            try {
              const result = await vtpassService.getServiceVariations(serviceId);
              if (result.success && result.variations) {
                const formattedPlans = result.variations.map(variation => ({
                  provider: provider.displayName,
                  providerName: provider.name,
                  providerId: provider._id.toString(),
                  serviceId: serviceId,
                  planId: variation.variation_code,
                  name: variation.name,
                  amount: parseFloat(variation.variation_amount || 0),
                  dataAmount: variation.variation_code,
                  validity: variation.name.toLowerCase().includes('day') ? 'Daily' :
                          variation.name.toLowerCase().includes('month') ? 'Monthly' : 'Other',
                  type: normalizePlanType(variation.name.toLowerCase().includes('sme') ? 'SME' : 'Regular'),
                  network: normalizeNetwork(serviceId.replace('-data', '')),
                  isActive: true
                }));
                plans.push(...formattedPlans);
              }
            } catch (error) {
              console.warn(`Failed to get variations for ${serviceId} from ${provider.name}:`, error.message);
            }
          }
        } else if (provider.name === 'clubkonnect') {
          clubkonnectService.setProvider(provider);

          try {
            const result = await clubkonnectService.getDataPlans();
            if (result.success && result.plans) {
              const formattedPlans = result.plans.map(plan => ({
                provider: provider.displayName,
                providerName: provider.name,
                providerId: provider._id.toString(),
                serviceId: plan.networkId || plan.network,
                planId: plan.productCode,
                name: plan.name,
                amount: plan.amount,
                dataAmount: plan.dataAmount,
                validity: plan.validity,
                type: normalizePlanType(plan.type),
                network: normalizeNetwork(plan.network),
                isActive: true
              }));
              plans.push(...formattedPlans);
            }
          } catch (error) {
            console.warn(`Failed to get data plans from ${provider.name}:`, error.message);
          }
        }

        allDataPlans.push({
          provider: provider.displayName,
          providerName: provider.name,
          providerId: provider._id.toString(),
          isActive: provider.isActive,
          isDefault: provider.isDefault,
          healthStatus: provider.healthStatus,
          plans: plans
        });

      } catch (error) {
        console.error(`Error fetching data plans from ${provider.name}:`, error);
        allDataPlans.push({
          provider: provider.displayName,
          providerName: provider.name,
          providerId: provider._id.toString(),
          isActive: provider.isActive,
          isDefault: provider.isDefault,
          healthStatus: provider.healthStatus,
          plans: [],
          error: error.message
        });
      }
    }

    res.status(200).json({
      message: "Data plans retrieved successfully",
      data: allDataPlans,
      totalProviders: providers.length,
      totalPlans: allDataPlans.reduce((sum, provider) => sum + provider.plans.length, 0)
    });

  } catch (error) {
    console.error("Error fetching all data plans:", error);
    res.status(500).json({
      message: "Error fetching data plans",
      error: error.message
    });
  }
};

// Get VTPass credentials for admin configuration
const getVTPassCredentials = async (req, res) => {
  try {
    const provider = await Provider.findOne({ name: 'vtpass' });

    if (!provider) {
      return res.status(404).json({
        message: "VTPass provider not found. Please create the VTPass provider first."
      });
    }

    // Return credentials for admin configuration
    res.status(200).json({
      message: "VTPass credentials retrieved successfully",
      credentials: {
        apiKey: provider.credentials.apiKey,
        publicKey: provider.credentials.publicKey,
        secretKey: provider.credentials.secretKey,
        baseUrl: provider.baseUrl
      },
      providerId: provider._id,
      isActive: provider.isActive,
      isDefault: provider.isDefault
    });
  } catch (error) {
    console.error("Error fetching VTPass credentials:", error);
    res.status(500).json({ message: "Error fetching VTPass credentials" });
  }
};

// Update VTPass credentials
const updateVTPassCredentials = async (req, res) => {
  try {
    const { apiKey, publicKey, secretKey, baseUrl } = req.body;

    // Validate required fields
    if (!apiKey || !publicKey || !secretKey || !baseUrl) {
      return res.status(400).json({
        message: "All VTPass credentials are required: apiKey, publicKey, secretKey, baseUrl"
      });
    }

    // Find or create VTPass provider
    let provider = await Provider.findOne({ name: 'vtpass' });

    if (!provider) {
      // Create new VTPass provider if it doesn't exist
      provider = new Provider({
        name: 'vtpass',
        displayName: 'VTPass',
        description: 'VTPass API Provider for utility services',
        credentials: {
          apiKey,
          publicKey,
          secretKey
        },
        baseUrl,
        supportedServices: ['data', 'airtime', 'cable', 'electricity'],
        endpoints: {
          walletBalance: '/api/balance',
          dataPurchase: '/api/pay',
          airtimePurchase: '/api/pay',
          cablePurchase: '/api/pay',
          electricityPurchase: '/api/pay',
          queryTransaction: '/api/requery',
          dataPlans: '/api/service-variations',
          serviceVariations: '/api/service-variations'
        }
      });
    } else {
      // Update existing provider credentials
      provider.credentials.apiKey = apiKey;
      provider.credentials.publicKey = publicKey;
      provider.credentials.secretKey = secretKey;
      provider.baseUrl = baseUrl;
    }

    await provider.save();

    // Log the credential update
    await createLog(
      'info',
      'VTPass credentials updated by admin',
      'system',
      req.user?.id,
      req.user?.email,
      {
        providerId: provider._id,
        providerName: provider.name,
        updatedFields: ['apiKey', 'publicKey', 'secretKey', 'baseUrl']
      },
      req
    );

    res.status(200).json({
      message: "VTPass credentials updated successfully",
      providerId: provider._id
    });
  } catch (error) {
    console.error("Error updating VTPass credentials:", error);

    // Log the error
    await createLog(
      'error',
      `Failed to update VTPass credentials: ${error.message}`,
      'system',
      req.user?.id,
      req.user?.email,
      { error: error.message },
      req
    );

    res.status(500).json({ message: "Error updating VTPass credentials" });
  }
};

// Get ClubKonnect credentials for admin configuration
const getClubKonnectCredentials = async (req, res) => {
  try {
    const provider = await Provider.findOne({ name: 'clubkonnect' });

    if (!provider) {
      return res.status(404).json({
        message: "ClubKonnect provider not found. Please create the ClubKonnect provider first."
      });
    }

    // Return credentials for admin configuration
    res.status(200).json({
      message: "ClubKonnect credentials retrieved successfully",
      credentials: {
        userId: provider.credentials.userId,
        apiKey: provider.credentials.apiKey,
        baseUrl: provider.baseUrl
      },
      providerId: provider._id,
      isActive: provider.isActive,
      isDefault: provider.isDefault
    });
  } catch (error) {
    console.error("Error fetching ClubKonnect credentials:", error);
    res.status(500).json({ message: "Error fetching ClubKonnect credentials" });
  }
};

// Update ClubKonnect credentials
const updateClubKonnectCredentials = async (req, res) => {
  try {
    const { userId, apiKey, baseUrl } = req.body;

    // Validate required fields
    if (!userId || !apiKey || !baseUrl) {
      return res.status(400).json({
        message: "All ClubKonnect credentials are required: userId, apiKey, baseUrl"
      });
    }

    // Find or create ClubKonnect provider
    let provider = await Provider.findOne({ name: 'clubkonnect' });

    if (!provider) {
      // Create new ClubKonnect provider if it doesn't exist
      provider = new Provider({
        name: 'clubkonnect',
        displayName: 'ClubKonnect',
        description: 'ClubKonnect API Provider for utility services',
        credentials: {
          userId,
          apiKey
        },
        baseUrl,
        supportedServices: ['data', 'airtime', 'cable', 'electricity'],
        endpoints: {
          walletBalance: '/APIWalletBalanceV1.asp',
          dataPurchase: '/APIDatabundleV1.asp',
          airtimePurchase: '/APIAirtimeV1.asp',
          cablePurchase: '/APICableV1.asp',
          electricityPurchase: '/APIElectricityV1.asp',
          queryTransaction: '/APIQueryV1.asp',
          cancelTransaction: '/APICancelV1.asp'
        }
      });
    } else {
      // Update existing provider credentials
      provider.credentials.userId = userId;
      provider.credentials.apiKey = apiKey;
      provider.baseUrl = baseUrl;
    }

    await provider.save();

    // Log the credential update
    await createLog(
      'info',
      'ClubKonnect credentials updated by admin',
      'system',
      req.user?.id,
      req.user?.email,
      {
        providerId: provider._id,
        providerName: provider.name,
        updatedFields: ['userId', 'apiKey', 'baseUrl']
      },
      req
    );

    res.status(200).json({
      message: "ClubKonnect credentials updated successfully",
      providerId: provider._id
    });
  } catch (error) {
    console.error("Error updating ClubKonnect credentials:", error);

    // Log the error
    await createLog(
      'error',
      `Failed to update ClubKonnect credentials: ${error.message}`,
      'system',
      req.user?.id,
      req.user?.email,
      { error: error.message },
      req
    );

    res.status(500).json({ message: "Error updating ClubKonnect credentials" });
  }
};

module.exports = {
  getAllProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider,
  setDefaultProvider,
  getActiveProviders,
  getDefaultProvider,
  testProviderConnection,
  getProviderAnalytics,
  bulkUpdateProviderStatus,
  getDataProviders,
  getAllDataPlans,
  getActiveAirtimeNetworkProviders,
  // Network Provider functions
  getAllNetworkProviders,
  createNetworkProvider,
  updateNetworkProvider,
  deleteNetworkProvider,
  toggleNetworkProviderStatus,
  getActiveNetworkProviders,
  setActiveProvider,
  getActiveProvider,
  // VTPass specific functions
  getVTPassCredentials,
  updateVTPassCredentials,
  // ClubKonnect specific functions
  getClubKonnectCredentials,
  updateClubKonnectCredentials,
};