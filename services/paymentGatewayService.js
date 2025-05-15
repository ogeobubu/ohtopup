const axios = require("axios");

const verifyBankAccount = async (accountNumber, bankCode) => {
  try {
    const response = await axios.get(`https://api.paystack.co/bank/resolve`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      params: {
        account_number: accountNumber,
        bank_code: bankCode,
      },
    });

    if (!response.data || !response.data.status) {
      // Paystack returned a 200 but with an unexpected body
      console.error(
        "Paystack bank verification failed: Unexpected response body",
        response.data
      );
      throw { status: 502, message: "Payment gateway verification failed." };
    }

    if (response.data.status === false) {
      // Paystack returned a 200 but reported a verification failure
      throw {
        status: 400,
        message: response.data.message || "Bank account could not be verified.",
      };
    }

    return {
      success: true,
      data: response.data.data, // The actual account details
    };
  } catch (error) {
    console.error(
      "Error verifying bank account with Paystack:",
      error.response?.data || error.message
    );
    // Re-throw with specific status/message based on Paystack response
    if (error.response?.status === 400) {
      throw {
        status: 400,
        message:
          error.response.data.message || "Invalid account details provided.",
      };
    }
    if (error.response) {
      throw {
        status: error.response.status,
        message:
          error.response.data.message ||
          "Error verifying account with payment gateway.",
      };
    }
    throw { status: 500, message: "Error communicating with payment gateway." };
  }
};

module.exports = {
  verifyBankAccount,
};
