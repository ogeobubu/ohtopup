const axios = require('axios');

const makePayment = async (url, apiKey, secretKey, requestData) => {
  const headers = {
    "api-key": apiKey,
    "secret-key": secretKey,
    "Content-Type": "application/json",
  };

  if (!url || !apiKey || !secretKey) {
    console.error("VTPASS environment variables not configured.");
    throw { status: 500, message: "Payment service not configured." };
  }

  try {
    const response = await axios.post(`${url}/api/pay`, requestData, { headers });
    return response.data;
  } catch (error) {
    console.error("Error during VTPASS API call:", error.message);

    if (error.response) {
      console.error("VTPASS API responded with error status:", error.response.status);
      console.error("VTPASS API error data:", error.response.data);
      throw {
        status: error.response.status || 502,
        message: "Payment gateway error.",
        details: error.response.data,
      };
    } else if (error.request) {
      console.error("No response received from VTPASS API.");
      throw { status: 504, message: "Payment gateway timeout. Please try again." };
    } else {
      console.error("Error setting up VTPASS API request:", error.message);
      throw { status: 500, message: "Could not send transaction request to payment gateway." };
    }
  }
};

const requeryTransaction = async (url, apiKey, secretKey, requestId) => {
  const headers = {
    "api-key": apiKey,
    "secret-key": secretKey,
    "Content-Type": "application/json",
  };

  if (!url || !apiKey || !secretKey) {
    console.error("VTPASS environment variables not configured.");
    throw { status: 500, message: "Payment service not configured." };
  }

  try {
    const response = await axios.post(`${url}/api/requery`, { request_id: requestId }, { headers });
    
    if (response.data.code === "000") {
      return response.data.content.transactions;
    } else {
      throw new Error(response.data.response_description);
    }
  } catch (error) {
    console.error("Error during VTPASS requery call:", error.message);

    if (error.response) {
      console.error("VTPASS API responded with error status:", error.response.status);
      throw {
        status: error.response.status || 502,
        message: "Requery error.",
        details: error.response.data,
      };
    } else if (error.request) {
      console.error("No response received from VTPASS API.");
      throw { status: 504, message: "Requery timeout. Please try again." };
    } else {
      console.error("Error setting up VTPASS requery request:", error.message);
      throw { status: 500, message: "Could not send requery request to payment gateway." };
    }
  }
};

module.exports = {
  makePayment,
  requeryTransaction,
};