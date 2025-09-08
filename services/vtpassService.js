require("dotenv").config();
const axios = require('axios');
const { createLog } = require('../controllers/systemLogController');

class VTPassService {
  constructor() {
    this.baseUrl = process.env.VTPASS_URL || "https://sandbox.vtpass.com";
    this.apiKey = process.env.VTPASS_API_KEY;
    this.secretKey = process.env.VTPASS_SECRET_KEY;
    this.publicKey = process.env.VTPASS_PUBLIC_KEY;
    this.provider = null;
  }

  // Initialize with provider credentials
  setProvider(provider) {
    this.provider = provider;
    this.baseUrl = provider.baseUrl;
    this.apiKey = provider.credentials.apiKey;
    this.secretKey = provider.credentials.secretKey;
    // Also store public key for GET requests
    if (provider.credentials.publicKey) {
      this.publicKey = provider.credentials.publicKey;
    }
  }

  // Check wallet balance
  async checkWalletBalance() {
    const startTime = Date.now();

    try {
      // For GET requests, use public-key instead of secret-key
      const headers = {
        "api-key": this.apiKey,
        "public-key": this.provider?.credentials?.publicKey || process.env.VTPASS_PUBLIC_KEY,
      };

      console.log("VTPass balance check - URL:", `${this.baseUrl}/api/balance`);
      console.log("VTPass balance check - Headers:", { ...headers, "public-key": "[HIDDEN]" });

      // Balance check is a GET request with public-key
      const response = await axios.get(
        `${this.baseUrl}/api/balance`,
        { headers, timeout: 30000 }
      );

      const responseTime = Date.now() - startTime;

      console.log("VTPass balance check - Response:", response.data);

      // Update provider health metrics
      await this.updateProviderMetrics(responseTime, true);

      return {
        success: true,
        balance: parseFloat(response.data.contents?.balance || response.data.balance || response.data.data?.balance || 0),
        currency: "NGN",
        responseTime,
        rawResponse: response.data,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.updateProviderMetrics(responseTime, false);

      // Log error to system logs without revealing 3rd party API name
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

      if (error.response?.status === 405) {
        await createLog(
          'warning',
          'Payment provider API method not allowed during balance check',
          'payment',
          null,
          null,
          {
            statusCode: 405,
            responseTime,
            providerId: this.provider?._id
          }
        );
      }

      return {
        success: false,
        error: 'Payment service temporarily unavailable. Please try again later.',
        statusCode: error.response?.status,
        responseTime,
      };
    }
  }

  // Get service variations (data plans, etc.)
  async getServiceVariations(serviceId) {
    const startTime = Date.now();

    try {
      const headers = {
        "api-key": this.apiKey,
        "secret-key": this.secretKey,
        "Content-Type": "application/json",
      };

      const response = await axios.get(
        `${this.baseUrl}/api/service-variations`,
        {
          params: { serviceID: serviceId },
          headers,
          timeout: 30000,
        }
      );

      const responseTime = Date.now() - startTime;

      // Update provider health metrics
      await this.updateProviderMetrics(responseTime, true);

      return {
        success: true,
        variations: response.data.content.varations || response.data.content.variations || [],
        responseTime,
        rawResponse: response.data,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.updateProviderMetrics(responseTime, false);

      // Log error to system logs without revealing 3rd party API name
      await createLog(
        'error',
        `Service variations fetch failed: ${error.message}`,
        'api',
        null,
        null,
        {
          statusCode: error.response?.status,
          responseTime,
          errorType: 'service_variations_failed',
          providerId: this.provider?._id,
          serviceId
        }
      );

      return {
        success: false,
        error: 'Unable to load service options at this time. Please try again later.',
        responseTime,
      };
    }
  }

  // Purchase service (data, airtime, cable, electricity)
  async makePayment(requestData) {
    const startTime = Date.now();

    try {
      // For POST requests, use api-key and secret-key
      const headers = {
        "api-key": this.apiKey,
        "secret-key": this.secretKey,
      };

      const response = await axios.post(
        `${this.baseUrl}/api/pay`,
        requestData,
        { headers, timeout: 60000 }
      );

      const responseTime = Date.now() - startTime;

      // Check VTPass response code and transaction status
      const vtpassResponse = response.data;
      const responseCode = vtpassResponse.code;
      const transactionStatus = vtpassResponse.content?.transactions?.status;

      // VTPass considers "000" as success code
      const isSuccessful = responseCode === "000" && transactionStatus === "delivered";

      console.log('VTPass Response Analysis:', {
        responseCode,
        transactionStatus,
        isSuccessful,
        responseDescription: vtpassResponse.response_description
      });

      // Update provider health metrics
      await this.updateProviderMetrics(responseTime, isSuccessful);

      if (isSuccessful) {
        return {
          success: true,
          data: vtpassResponse,
          responseTime,
          rawResponse: vtpassResponse,
        };
      } else {
        // Transaction failed even though HTTP request succeeded
        return {
          success: false,
          error: vtpassResponse.response_description || 'Transaction failed',
          data: vtpassResponse,
          responseTime,
          rawResponse: vtpassResponse,
          details: {
            responseCode,
            transactionStatus,
            vtpassError: vtpassResponse
          }
        };
      }
    } catch (error) {
      console.log(error)
      const responseTime = Date.now() - startTime;
      await this.updateProviderMetrics(responseTime, false);

      // Log detailed error information for debugging
      console.error('VTPass Payment Error Details:');
      console.error('Error message:', error.message);
      console.error('Status code:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Request data:', { ...requestData, phone: '[REDACTED]' });

      // Log error to system logs without revealing 3rd party API name
      await createLog(
        'error',
        `Payment processing failed: ${error.message}`,
        'payment',
        null,
        null,
        {
          statusCode: error.response?.status,
          responseTime,
          errorType: 'payment_failed',
          providerId: this.provider?._id,
          requestData: { ...requestData, phone: '[REDACTED]' }, // Redact sensitive data
          vtpassError: error.response?.data // Include VTPass error details
        }
      );

      return {
        success: false,
        error: 'Payment processing failed. Please try again or contact support if the issue persists.',
        responseTime,
        details: {
          statusCode: error.response?.status,
          vtpassError: error.response?.data
        }
      };
    }
  }

  // Requery transaction status
  async requeryTransaction(requestId) {
    const startTime = Date.now();

    try {
      const headers = {
        "api-key": this.apiKey,
        "secret-key": this.secretKey,
        "Content-Type": "application/json",
      };

      const response = await axios.post(
        `${this.baseUrl}/api/requery`,
        { request_id: requestId },
        { headers, timeout: 30000 }
      );

      const responseTime = Date.now() - startTime;

      // Update provider health metrics
      await this.updateProviderMetrics(responseTime, true);

      if (response.data.code === "000") {
        return {
          success: true,
          transaction: response.data.content.transactions,
          responseTime,
          rawResponse: response.data,
        };
      } else {
        throw new Error(response.data.response_description);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.updateProviderMetrics(responseTime, false);

      // Log error to system logs without revealing 3rd party API name
      await createLog(
        'error',
        `Transaction status check failed: ${error.message}`,
        'transaction',
        null,
        null,
        {
          statusCode: error.response?.status,
          responseTime,
          errorType: 'transaction_requery_failed',
          providerId: this.provider?._id,
          requestId
        }
      );

      return {
        success: false,
        error: 'Unable to verify transaction status. Please contact support if you have any concerns.',
        responseTime,
      };
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

  // Legacy methods for backward compatibility
  async makePaymentLegacy(url, apiKey, secretKey, requestData) {
    const oldUrl = this.baseUrl;
    const oldApiKey = this.apiKey;
    const oldSecretKey = this.secretKey;

    this.baseUrl = url;
    this.apiKey = apiKey;
    this.secretKey = secretKey;

    const result = await this.makePayment(requestData);

    this.baseUrl = oldUrl;
    this.apiKey = oldApiKey;
    this.secretKey = oldSecretKey;

    return result;
  }

  async requeryTransactionLegacy(url, apiKey, secretKey, requestId) {
    const oldUrl = this.baseUrl;
    const oldApiKey = this.apiKey;
    const oldSecretKey = this.secretKey;

    this.baseUrl = url;
    this.apiKey = apiKey;
    this.secretKey = secretKey;

    const result = await this.requeryTransaction(requestId);

    this.baseUrl = oldUrl;
    this.apiKey = oldApiKey;
    this.secretKey = oldSecretKey;

    return result;
  }
}

module.exports = new VTPassService();