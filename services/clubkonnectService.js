const axios = require("axios");

class ClubkonnectService {
  constructor() {
    this.baseUrl = "https://www.nellobytesystems.com";
    this.provider = null;
  }

  // Initialize with provider credentials
  setProvider(provider) {
    this.provider = provider;
    // Use provider credentials if available, otherwise fall back to environment variables
    this.baseUrl = provider?.baseUrl || "https://www.nellobytesystems.com";
  }

  // Check wallet balance
  async checkWalletBalance() {
    try {
      const startTime = Date.now();

      const response = await axios.get(
        `${this.baseUrl}/APIWalletBalanceV1.asp`,
        {
          params: {
            UserID: this.provider?.credentials?.userId || process.env.CLUBKONNECT_USER_ID,
            APIKey: this.provider?.credentials?.apiKey || process.env.CLUBKONNECT_API_KEY,
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      const responseTime = Date.now() - startTime;

      // Update provider health metrics
      await this.updateProviderMetrics(responseTime, true);

      return {
        success: true,
        balance: parseFloat(response.data.balance),
        currency: "NGN",
        responseTime,
        rawResponse: response.data,
      };
    } catch (error) {
      const responseTime = Date.now() - Date.now();
      await this.updateProviderMetrics(responseTime, false);

      // Log error to system logs without revealing 3rd party API name
      const { createLog } = require('../controllers/systemLogController');
      await createLog(
        'error',
        `Payment provider balance check failed: ${error.message}`,
        'payment',
        null,
        null,
        {
          statusCode: error.response?.status,
          responseTime,
          errorType: 'balance_check_failed',
          providerId: this.provider?._id
        }
      );
      return {
        success: false,
        error: error.message,
        responseTime,
      };
    }
  }

  // Purchase data bundle
  async purchaseData(networkCode, dataPlan, mobileNumber, requestId, callbackUrl = null) {
    try {
      const startTime = Date.now();

      const params = {
        UserID: this.provider?.credentials?.userId || process.env.CLUBKONNECT_USER_ID,
        APIKey: this.provider?.credentials?.apiKey || process.env.CLUBKONNECT_API_KEY,
        MobileNetwork: networkCode,
        DataPlan: dataPlan,
        MobileNumber: mobileNumber,
        RequestID: requestId,
      };

      if (callbackUrl) {
        params.CallBackURL = callbackUrl;
      }

      const response = await axios.get(
        `${this.baseUrl}/APIDatabundleV1.asp`,
        {
          params,
          timeout: 60000, // 60 seconds timeout for purchases
        }
      );

      const responseTime = Date.now() - startTime;

      // Update provider health metrics
      await this.updateProviderMetrics(responseTime, true);

      return {
        success: true,
        orderId: response.data.orderid,
        statusCode: response.data.statuscode,
        status: response.data.status,
        responseTime,
        rawResponse: response.data,
        data: response.data, // Add data property for consistency
      };
    } catch (error) {
      const responseTime = Date.now() - Date.now();
      await this.updateProviderMetrics(responseTime, false);

      // Log error to system logs without revealing 3rd party API name
      await createLog(
        'error',
        `Data purchase failed: ${error.message}`,
        'transaction',
        null,
        null,
        {
          statusCode: error.response?.status,
          responseTime,
          errorType: 'data_purchase_failed',
          providerId: this.provider?._id,
          networkCode,
          dataPlan,
          mobileNumber: mobileNumber?.replace(/(\d{3})\d{6}(\d{3})/, '$1******$2') // Mask phone number
        }
      );
      return {
        success: false,
        error: error.message,
        responseTime,
      };
    }
  }

  // Purchase airtime
  async purchaseAirtime(networkCode, amount, mobileNumber, requestId, callbackUrl = null) {
    try {
      const startTime = Date.now();

      const params = {
        UserID: this.provider?.credentials?.userId || process.env.CLUBKONNECT_USER_ID,
        APIKey: this.provider?.credentials?.apiKey || process.env.CLUBKONNECT_API_KEY,
        MobileNetwork: networkCode,
        Amount: amount,
        MobileNumber: mobileNumber,
        RequestID: requestId,
      };

      if (callbackUrl) {
        params.CallBackURL = callbackUrl;
      }

      const response = await axios.get(
        `${this.baseUrl}/APIAirtimeV1.asp`,
        {
          params,
          timeout: 60000, // 60 seconds timeout for purchases
        }
      );

      const responseTime = Date.now() - startTime;

      // Update provider health metrics
      await this.updateProviderMetrics(responseTime, true);

      return {
        success: true,
        orderId: response.data.orderid,
        statusCode: response.data.statuscode,
        status: response.data.status,
        responseTime,
        rawResponse: response.data,
        data: response.data, // Add data property for consistency
      };
    } catch (error) {
      const responseTime = Date.now() - Date.now();
      await this.updateProviderMetrics(responseTime, false);

      // Log error to system logs without revealing 3rd party API name
      const { createLog } = require('../controllers/systemLogController');
      await createLog(
        'error',
        `Airtime purchase failed: ${error.message}`,
        'transaction',
        null,
        null,
        {
          statusCode: error.response?.status,
          responseTime,
          errorType: 'airtime_purchase_failed',
          providerId: this.provider?._id,
          networkCode,
          amount,
          mobileNumber: mobileNumber?.replace(/(\d{3})\d{6}(\d{3})/, '$1******$2') // Mask phone number
        }
      );
      return {
        success: false,
        error: error.message,
        responseTime,
      };
    }
  }

  // Query transaction status
  async queryTransaction(orderId = null, requestId = null) {
    try {
      const startTime = Date.now();

      const params = {
        UserID: this.provider?.credentials?.userId || process.env.CLUBKONNECT_USER_ID,
        APIKey: this.provider?.credentials?.apiKey || process.env.CLUBKONNECT_API_KEY,
      };

      if (orderId) {
        params.OrderID = orderId;
      } else if (requestId) {
        params.RequestID = requestId;
      }

      const response = await axios.get(
        `${this.baseUrl}/APIQueryV1.asp`,
        {
          params,
          timeout: 30000,
        }
      );

      const responseTime = Date.now() - startTime;

      // Update provider health metrics
      await this.updateProviderMetrics(responseTime, true);

      return {
        success: true,
        orderId: response.data.orderid,
        requestId: response.data.requestid,
        statusCode: response.data.statuscode,
        status: response.data.status,
        remark: response.data.remark,
        orderType: response.data.ordertype,
        mobileNetwork: response.data.mobilenetwork,
        mobileNumber: response.data.mobilenumber,
        amountCharged: parseFloat(response.data.amountcharged || 0),
        walletBalance: parseFloat(response.data.walletbalance || 0),
        date: response.data.date,
        responseTime,
        rawResponse: response.data,
      };
    } catch (error) {
      const responseTime = Date.now() - Date.now();
      await this.updateProviderMetrics(responseTime, false);

      // Log error to system logs without revealing 3rd party API name
      await createLog(
        'error',
        `Transaction query failed: ${error.message}`,
        'transaction',
        null,
        null,
        {
          statusCode: error.response?.status,
          responseTime,
          errorType: 'transaction_query_failed',
          providerId: this.provider?._id,
          orderId,
          requestId
        }
      );
      return {
        success: false,
        error: error.message,
        responseTime,
      };
    }
  }

  // Cancel transaction
  async cancelTransaction(orderId) {
    try {
      const startTime = Date.now();

      const response = await axios.get(
        `${this.baseUrl}/APICancelV1.asp`,
        {
          params: {
            UserID: this.provider?.credentials?.userId || process.env.CLUBKONNECT_USER_ID,
            APIKey: this.provider?.credentials?.apiKey || process.env.CLUBKONNECT_API_KEY,
            OrderID: orderId,
          },
          timeout: 30000,
        }
      );

      const responseTime = Date.now() - startTime;

      // Update provider health metrics
      await this.updateProviderMetrics(responseTime, true);

      return {
        success: true,
        status: response.data.status,
        orderId: response.data.orderid,
        responseTime,
        rawResponse: response.data,
      };
    } catch (error) {
      const responseTime = Date.now() - Date.now();
      await this.updateProviderMetrics(responseTime, false);

      // Log error to system logs without revealing 3rd party API name
      await createLog(
        'error',
        `Transaction cancel failed: ${error.message}`,
        'transaction',
        null,
        null,
        {
          statusCode: error.response?.status,
          responseTime,
          errorType: 'transaction_cancel_failed',
          providerId: this.provider?._id,
          orderId
        }
      );
      return {
        success: false,
        error: error.message,
        responseTime,
      };
    }
  }

  // Get data plans from Clubkonnect API
  async getDataPlans() {
    try {
      const startTime = Date.now();

      const response = await axios.get(
        `${this.baseUrl}/APIDatabundlePlansV2.asp`,
        {
          params: {
            UserID: this.provider?.credentials?.userId || process.env.CLUBKONNECT_USER_ID,
            APIKey: this.provider?.credentials?.apiKey || process.env.CLUBKONNECT_API_KEY,
          },
          timeout: 30000,
        }
      );

      const responseTime = Date.now() - startTime;

      // Update provider health metrics
      await this.updateProviderMetrics(responseTime, true);

      // Parse the response structure
      const parsedPlans = await this.parseDataPlansResponse(response.data);

      return {
        success: true,
        plans: parsedPlans,
        responseTime,
        rawResponse: response.data,
      };
    } catch (error) {
      const responseTime = Date.now() - Date.now();
      await this.updateProviderMetrics(responseTime, false);

      // Log error to system logs without revealing 3rd party API name
      await createLog(
        'error',
        `Data plans fetch failed: ${error.message}`,
        'api',
        null,
        null,
        {
          statusCode: error.response?.status,
          responseTime,
          errorType: 'data_plans_fetch_failed',
          providerId: this.provider?._id
        }
      );
      return {
        success: false,
        error: error.message,
        responseTime,
      };
    }
  }

  // Parse Clubkonnect data plans response
  async parseDataPlansResponse(data) {
    const plans = [];

    try {
      // The response structure is: { MOBILE_NETWORK: { MTN: [...], Glo: [...], etc. } }
      if (data && data.MOBILE_NETWORK) {
        const mobileNetwork = data.MOBILE_NETWORK;

        // Process each network (MTN, Glo, m_9mobile, Airtel)
        Object.keys(mobileNetwork).forEach(networkName => {
          const networkData = mobileNetwork[networkName];

          if (Array.isArray(networkData) && networkData.length > 0) {
            const networkInfo = networkData[0];
            const networkId = networkInfo.ID;

            // Process each product in the network
            if (networkInfo.PRODUCT && Array.isArray(networkInfo.PRODUCT)) {
              networkInfo.PRODUCT.forEach(product => {
                plans.push({
                  network: networkName,
                  networkId: networkId,
                  productCode: product.PRODUCT_CODE,
                  productId: product.PRODUCT_ID,
                  name: product.PRODUCT_NAME,
                  amount: parseFloat(product.PRODUCT_AMOUNT),
                  dataAmount: this.parseDataAmount(product.PRODUCT_ID),
                  validity: this.parseValidity(product.PRODUCT_NAME),
                  type: this.categorizePlan(product.PRODUCT_NAME),
                });
              });
            }
          }
        });
      }

      return plans;
    } catch (error) {
      // Log parsing error to system logs
      await createLog(
        'error',
        `Data plans parsing failed: ${error.message}`,
        'system',
        null,
        null,
        {
          errorType: 'data_plans_parsing_failed',
          providerId: this.provider?._id,
          errorStack: error.stack
        }
      );
      return [];
    }
  }

  // Parse data amount from product ID (e.g., "500.0" -> "500MB", "1.0" -> "1GB")
  parseDataAmount(productId) {
    try {
      const amount = parseFloat(productId);
      if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}GB`;
      } else if (amount >= 1) {
        return `${amount}GB`;
      } else {
        return `${amount * 1000}MB`;
      }
    } catch (error) {
      return productId;
    }
  }

  // Parse validity period from product name
  parseValidity(productName) {
    try {
      const name = productName.toLowerCase();

      if (name.includes('day') || name.includes('days')) {
        const match = name.match(/(\d+)\s*days?/);
        if (match) {
          const days = parseInt(match[1]);
          return `${days} day${days > 1 ? 's' : ''}`;
        }
      }

      if (name.includes('week') || name.includes('weekly')) {
        return '7 days';
      }

      if (name.includes('month') || name.includes('monthly')) {
        const match = name.match(/(\d+)\s*months?/);
        if (match) {
          const months = parseInt(match[1]);
          return `${months} month${months > 1 ? 's' : ''}`;
        }
        return '30 days';
      }

      // Default fallback
      return '30 days';
    } catch (error) {
      return '30 days';
    }
  }

  // Categorize plan type based on name
  categorizePlan(productName) {
    try {
      const name = productName.toLowerCase();

      if (name.includes('daily') || name.includes('day')) {
        return 'Daily';
      }

      if (name.includes('weekly') || name.includes('week')) {
        return 'Weekly';
      }

      if (name.includes('monthly') || name.includes('month')) {
        return 'Monthly';
      }

      if (name.includes('sme')) {
        return 'SME';
      }

      if (name.includes('direct')) {
        return 'Direct';
      }

      if (name.includes('awoof')) {
        return 'Awoof';
      }

      return 'Regular';
    } catch (error) {
      return 'Regular';
    }
  }

  // Update provider health metrics
  async updateProviderMetrics(responseTime, success) {
    if (!this.provider) return;

    try {
      const { Provider } = require("../model/Provider");

      // Get current values with defaults
      const currentTotalRequests = this.provider.totalRequests || 0;
      const currentSuccessfulRequests = this.provider.successfulRequests || 0;
      const currentFailedRequests = this.provider.failedRequests || 0;

      const updateData = {
        lastHealthCheck: new Date(),
        responseTime,
        totalRequests: currentTotalRequests + 1,
      };

      if (success) {
        updateData.successfulRequests = currentSuccessfulRequests + 1;
        updateData.failedRequests = currentFailedRequests; // Keep failed count same
      } else {
        updateData.successfulRequests = currentSuccessfulRequests; // Keep successful count same
        updateData.failedRequests = currentFailedRequests + 1;
      }

      // Calculate success rate safely
      const totalRequests = updateData.totalRequests;
      const successfulRequests = updateData.successfulRequests || 0;

      if (totalRequests > 0 && !isNaN(successfulRequests) && !isNaN(totalRequests)) {
        updateData.successRate = Math.round((successfulRequests / totalRequests) * 100);
      } else {
        updateData.successRate = 100; // Default to 100% if calculation fails
      }

      // Ensure successRate is a valid number
      if (isNaN(updateData.successRate)) {
        updateData.successRate = 0;
      }

      // Update health status based on success rate
      if (updateData.successRate >= 95) {
        updateData.healthStatus = "healthy";
      } else if (updateData.successRate >= 80) {
        updateData.healthStatus = "degraded";
      } else {
        updateData.healthStatus = "down";
      }

      await Provider.findByIdAndUpdate(this.provider._id, updateData);
    } catch (error) {
      // Log metrics update failure without revealing API names
      const { createLog } = require('../controllers/systemLogController');
      await createLog(
        'error',
        `Failed to update provider health metrics: ${error.message}`,
        'system',
        null,
        null,
        {
          providerId: this.provider?._id,
          errorType: 'metrics_update_failed'
        }
      );
    }
  }

  // Network code mapping for Clubkonnect
  getNetworkCode(network) {
    const networkMap = {
      "01": "MTN",
      "02": "Glo",
      "03": "Etisalat",
      "04": "Airtel",
      "mtn": "01",
      "glo": "02",
      "etisalat": "03",
      "airtel": "04",
    };

    return networkMap[network.toLowerCase()] || network;
  }

  // Status code mapping
  getStatusDescription(statusCode) {
    const statusMap = {
      "100": "ORDER_RECEIVED",
      "200": "ORDER_COMPLETED",
      "300": "ORDER_FAILED",
      "400": "ORDER_CANCELLED",
    };

    return statusMap[statusCode] || "UNKNOWN_STATUS";
  }
}

module.exports = new ClubkonnectService();