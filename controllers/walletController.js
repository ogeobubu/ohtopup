const Wallet = require("../model/Wallet");
const Transaction = require("../model/Transaction");
const axios = require("axios");
const {generateRandomAccountNumber} = require("../utils")

const fetchBankCodes = async () => {
  try {
    const response = await axios.get("https://api.paystack.co/bank", {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    return response.data.data;
  } catch (error) {
    console.error("Error fetching bank codes:", error);
    throw error;
  }
};

const createWallet = async (req, res) => {
  try {
    const wallet = new Wallet({ userId: req.userId });
    await wallet.save();
    res.status(201).json(wallet);
  } catch (error) {
    res.status(500).json({ message: "Error creating wallet", error });
  }
};

const getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: "Error fetching wallet", error });
  }
};

const depositWallet = async (req, res) => {
  const { amount } = req.body;

  try {
    const wallet = await Wallet.findOne({ userId: req.userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    wallet.balance += amount;

    const transaction = new Transaction({
      walletId: wallet._id,
      amount,
      type: "deposit",
    });
    await transaction.save();

    wallet.transactions.push(transaction._id);
    await wallet.save();

    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: "Error depositing to wallet", error });
  }
};

const withdrawWallet = async (req, res) => {
  const { amount } = req.body;

  try {
    const wallet = await Wallet.findOne({ userId: req.userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    if (wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    wallet.balance -= amount;

    const transaction = new Transaction({
      walletId: wallet._id,
      amount,
      type: "withdrawal",
    });
    await transaction.save();

    wallet.transactions.push(transaction._id);
    await wallet.save();

    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: "Error withdrawing from wallet", error });
  }
};


// Function to create a customer
const createCustomer = async (customerData) => {
  try {
    const response = await axios.post("https://api.paystack.co/customer", customerData, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });
    return response.data.data;
  } catch (error) {
    console.error("Error creating customer:", error.response.data);
    throw new Error("Failed to create customer");
  }
};

const createDedicatedAccount = async (customerId) => {
  try {
    const response = await axios.post(
      "https://api.paystack.co/dedicated_account",
      {
        customer: customerId,
        preferred_bank: "test-bank",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error creating dedicated account:", error.response.data);
    throw new Error("Failed to create dedicated account");
  }
};

const handleCreateCustomerAndAccount = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email address required" });
  }

  try {
    const customerData = {
      email
    };
    const customer = await createCustomer(customerData);

    const dedicatedAccount = await createDedicatedAccount(customer.customer_code);

    return res.status(201).json({
      message: "Dedicated account created successfully",
      customer,
      dedicatedAccount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createWallet,
  getWallet,
  depositWallet,
  withdrawWallet,
  handleCreateCustomerAndAccount
};