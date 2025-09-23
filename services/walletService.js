// walletService.js

const Wallet = require("../model/Wallet");
const Transaction = require("../model/Transaction");
const User = require("../model/User");
const axios = require("axios");
require("dotenv").config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

const checkWalletForDebit = (wallet, amount) => {
    if (!wallet) {
         throw { status: 404, message: "Wallet not found." };
    }
    if (!wallet.isActive) {
      throw { status: 400, message: "Wallet is disabled. Transactions cannot be made." };
    }

    if (wallet.balance < amount) {
      throw { status: 400, message: "Insufficient funds in wallet." };
    }
    return true;
};

const debitWallet = async (wallet, amount) => {
    if (!wallet) {
         throw new Error("Wallet object is null or undefined for debit.");
    }
    wallet.balance -= amount;
    await wallet.save();
    return wallet;
};

const creditWallet = async (wallet, amount) => {
  if (!wallet) {
    throw new Error("Wallet object is null or undefined for credit.");
  }
  wallet.balance += amount;
  await wallet.save();
  return wallet;
};

const recordTransaction = async (
  walletId,
  reference,
  amount,
  type,
  status,
  paymentMethod,
  details = {}
) => {
  // Check if transaction with this reference already exists
  const existingTransaction = await Transaction.findOne({ reference });
  if (existingTransaction) {
    console.warn(`Transaction with reference ${reference} already exists. Returning existing transaction.`);
    return existingTransaction;
  }

  const transaction = new Transaction({
    walletId,
    amount,
    type,
    status,
    reference,
    paymentMethod,
    ...details
  });
  await transaction.save();
  return transaction;
};

const updateTransactionStatus = async (reference, newStatus) => {
  const transaction = await Transaction.findOne({ reference });

  if (!transaction) {
    throw new Error(`Transaction with reference ${reference} not found.`);
  }

  transaction.status = newStatus;
  if (newStatus === 'completed' && !transaction.completedAt) {
      transaction.completedAt = new Date();
  } else if (newStatus === 'failed' && !transaction.failedAt) {
      transaction.failedAt = new Date();
  }

  await transaction.save();
  return transaction;
};

const findTransactionByReference = async (reference) => {
    return await Transaction.findOne({ reference });
};

const findCompletedTransactionByReference = async (reference) => {
    return await Transaction.findOne({ reference, status: 'completed' });
};

const handleReferralDepositReward = async (userId, amount) => {
  if (amount < 1000) {
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    console.warn(`Referral reward attempted for non-existent user: ${userId}`);
    return;
  }

  // Find the user's wallet
  const wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    console.warn(`Referral reward attempted for user ${userId} but no wallet found`);
    return;
  }

  const userDepositTransactions = await Transaction.countDocuments({
      walletId: wallet._id,
      type: 'deposit',
      status: 'completed'
  });

  const isFirstQualifyingDeposit = userDepositTransactions === 1;

  if (!isFirstQualifyingDeposit) {
       if (userDepositTransactions > 1) {
            console.log(`User ${userId} already has completed deposits. Not a first deposit reward.`);
       } else {
             console.warn(`User ${userId} completed deposit, but deposit count is 0/1? Check logic. Count: ${userDepositTransactions}`);
       }
       return;
  }

  if (user.referrerCode) {
    const referrer = await User.findOne({ referralCode: user.referrerCode });
    if (referrer) {
      if (referrer.referredUsersRewardedForDeposit && referrer.referredUsersRewardedForDeposit.includes(userId.toString())) {
           console.log(`Referrer ${referrer._id} already rewarded for referee ${userId}'s first deposit.`);
           return;
      }

      referrer.points = (referrer.points || 0) + 500;
      referrer.referredUsersRewardedForDeposit = referrer.referredUsersRewardedForDeposit || [];
      referrer.referredUsersRewardedForDeposit.push(userId);


      await referrer.save();
      console.log(`Rewarded referrer ${referrer._id} (code ${referrer.referralCode}) 500 points for referee ${userId}'s first qualifying deposit.`);

    } else {
        console.log(`User ${userId} has referrerCode ${user.referrerCode} but referrer not found.`);
    }
  } else {
       console.log(`User ${userId} has no referrerCode.`);
  }
};

const authenticateMonnify = async (base64Credentials) => {
  try {
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
      if (!response.data || !response.data.requestSuccessful || !response.data.responseBody?.accessToken) {
          throw new Error("Monnify authentication failed: Invalid response");
      }
      return response.data.responseBody.accessToken;
  } catch (error) {
      console.error("Error authenticating with Monnify:", error.response?.data || error.message);
      throw new Error(`Monnify Authentication Error: ${error.response?.data?.responseMessage || error.message}`);
  }
};

const fetchMonnifyTransaction = async (encodedRef, accessToken) => {
  try {
      const response = await axios.get(
        `${process.env.MONNIFY_URL}/api/v2/transactions/${encodedRef}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
       if (!response.data || !response.data.requestSuccessful || !response.data.responseBody) {
          throw new Error("Monnify fetch transaction failed: Invalid response");
      }
      return response.data;
  } catch (error) {
       console.error("Error fetching Monnify transaction:", error.response?.data || error.message);
       throw new Error(`Monnify Fetch Transaction Error: ${error.response?.data?.responseMessage || error.message}`);
  }
};

const initiateMonnifyWithdrawal = async (accessToken, data) => {
    try {
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
         if (!response.data || !response.data.requestSuccessful) {
          throw new Error("Monnify initiate withdrawal failed: Invalid response");
         }
        return response.data;
    } catch (error) {
         console.error("Error initiating Monnify withdrawal:", error.response?.data || error.message);
         throw new Error(`Monnify Withdrawal Initiation Error: ${error.response?.data?.responseMessage || error.message}`);
    }
};

const authorizeMonnifyWithdrawal = async (accessToken, data) => {
    try {
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
         if (!response.data || !response.data.requestSuccessful) {
          throw new Error("Monnify authorize withdrawal failed: Invalid response");
         }
        return response.data;
    } catch (error) {
         console.error("Error authorizing Monnify withdrawal:", error.response?.data || error.message);
         throw new Error(`Monnify Withdrawal Authorization Error: ${error.response?.data?.responseMessage || error.message}`);
    }
};

const fetchPaystackTransaction = async (reference) => {
    try {
        const { data } = await axios.get(
          `https://api.paystack.co/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
          }
        );
        if (!data || !data.status || !data.data) {
             throw new Error("Paystack fetch transaction failed: Invalid response");
        }
        return data.data;
    } catch (error) {
        console.error("Error fetching Paystack transaction:", error.response?.data || error.message);
        throw new Error(`Paystack Fetch Transaction Error: ${error.response?.data?.message || error.message}`);
    }
};

const createPaystackRecipient = async (recipientData) => {
    try {
        const response = await axios.post(
          `https://api.paystack.co/transferrecipient`,
          recipientData,
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );
         if (!response.data || !response.data.status || !response.data.data) {
             throw new Error("Paystack create recipient failed: Invalid response");
         }
        return response.data.data;
    } catch (error) {
         console.error("Error creating Paystack recipient:", error.response?.data || error.message);
         throw new Error(`Paystack Create Recipient Error: ${error.response?.data?.message || error.message}`);
    }
};

const initiatePaystackTransfer = async (transferData) => {
     try {
        const response = await axios.post(
          `https://api.paystack.co/transfer`,
          transferData,
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
          }
        );
         if (!response.data || !response.data.status || !response.data.data) {
            const paystackError = response.data?.message || "Paystack initiate transfer failed";
            const paystackErrorCode = response.data?.code;
             throw new Error(`Paystack Transfer Initiation Error: ${paystackError}`, { cause: { code: paystackErrorCode, details: response.data }});
         }
        return response.data.data;
    } catch (error) {
         console.error("Error initiating Paystack transfer:", error.response?.data || error.message);
         if (error.response?.data?.code === "transfer_unavailable") {
             throw new Error("Transfer unavailable: You cannot initiate third-party payouts as a starter business.", { cause: error.response.data });
         }
         throw new Error(`Paystack Transfer Initiation Error: ${error.response?.data?.message || error.message}`, { cause: error.response?.data });
    }
};

const calculatePaystackFee = async (amount) => {
    try {
        const WalletSettings = require("../model/WalletSettings");
        let settings = await WalletSettings.findOne();

        if (!settings) {
            // Use default values if no settings exist
            settings = {
                paystackFee: {
                    percentage: 1.5,
                    fixedFee: 100,
                    cap: 2000
                }
            };
        }

        const fee = Math.min(
            settings.paystackFee.cap,
            (amount * (settings.paystackFee.percentage / 100)) + settings.paystackFee.fixedFee
        );
        return Math.round(fee * 100) / 100; // Round to 2 decimal places
    } catch (error) {
        console.error("Error calculating Paystack fee:", error);
        // Fallback to default calculation
        const fee = Math.min(2000, (amount * 0.015) + 100);
        return Math.round(fee * 100) / 100;
    }
};

const verifyBankAccount = async (accountNumber, bankCode) => {
    try {
        const response = await axios.get(
          `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
          }
        );
         if (!response.data || !response.data.status || !response.data.data) {
             throw new Error("Paystack bank account verification failed: Invalid response");
         }
        return response.data.data;
    } catch (error) {
         console.error("Error verifying bank account:", error.response?.data || error.message);
         throw new Error(`Paystack Bank Account Verification Error: ${error.response?.data?.message || error.message}`);
    }
};

module.exports = {
  checkWalletForDebit,
  debitWallet,
  creditWallet,
  recordTransaction,
  updateTransactionStatus,
  findTransactionByReference,
  findCompletedTransactionByReference,

  handleReferralDepositReward,

  authenticateMonnify,
  fetchMonnifyTransaction,
  initiateMonnifyWithdrawal,
  authorizeMonnifyWithdrawal,
  fetchPaystackTransaction,
  createPaystackRecipient,
  initiatePaystackTransfer,
  verifyBankAccount,
  calculatePaystackFee,
};