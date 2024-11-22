const Wallet = require("../model/Wallet");
const Transaction = require("../model/Transaction");
const axios = require("axios");
const { generateRandomAccountNumber } = require("../utils");

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
  const { userId } = req.body;
  try {
    const wallet = new Wallet({ userId });
    await wallet.save();
    res.status(201).json(wallet);
  } catch (error) {
    res.status(500).json({ message: "Error creating wallet", error });
  }
};

const getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user.id });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (!wallet.isActive) {
      return res.status(404).json({ message: "Your wallet is disabled" });
    }

    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: "Error fetching wallet", error });
  }
};

const getWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find().populate("userId", "username email");
    if (!wallets || wallets.length === 0) {
      return res.status(404).json({ message: "No wallets found" });
    }

    const walletDetails = wallets.map((wallet) => ({
      _id: wallet._id,
      userId: wallet.userId._id,
      username: wallet.userId.username,
      email: wallet.userId.email,
      balance: wallet.balance,
      transactions: wallet.transactions,
      isActive: wallet.isActive,
    }));

    res.json({
      data: walletDetails,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching wallets", error });
  }
};

const depositWallet = async (req, res) => {
  const { userId, amount } = req.body;
  let transaction = null; // Declare transaction here

  try {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    transaction = new Transaction({
      walletId: wallet._id,
      amount,
      type: "deposit",
      status: "pending",
    });
    await transaction.save();

    // Update the wallet balance
    wallet.balance += amount;
    wallet.transactions.push(transaction._id);
    await wallet.save();

    transaction.status = "completed";
    await transaction.save();

    res.json(wallet);
  } catch (error) {
    // If transaction was created, update its status to failed
    if (transaction) {
      transaction.status = "failed";
      await transaction.save();
    }
    res.status(500).json({ message: "Error depositing to wallet", error });
  }
};

const withdrawWallet = async (req, res) => {
  const { amount, bankName, accountNumber } = req.body;

  try {
    const wallet = await Wallet.findOne({ userId: req.user.id });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    wallet.balance -= amount;
    const transaction = new Transaction({
      walletId: wallet._id,
      amount,
      type: "withdrawal",
      bankName,
      accountNumber,
      status: "pending",
    });
    await transaction.save();

    wallet.transactions.push(transaction._id);
    await wallet.save();

    transaction.status = "completed";
    await transaction.save();

    return res.status(200).json({
      message: "Withdrawal successful",
      wallet: {
        balance: wallet.balance,
        transactions: wallet.transactions,
      },
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        status: transaction.status,
      },
    });
  } catch (error) {
    console.error(error);
    if (transaction) {
      transaction.status = "failed";
      await transaction.save();
    }

    return res
      .status(500)
      .json({ message: "Error withdrawing from wallet", error: error.message });
  }
};

const createCustomer = async (customerData) => {
  try {
    const response = await axios.post(
      "https://api.paystack.co/customer",
      customerData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
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
      email,
    };
    const customer = await createCustomer(customerData);

    const dedicatedAccount = await createDedicatedAccount(
      customer.customer_code
    );

    return res.status(201).json({
      message: "Dedicated account created successfully",
      customer,
      dedicatedAccount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const toggleWalletStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const wallet = await Wallet.findById(id);
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    wallet.isActive = !wallet.isActive;
    await wallet.save();

    res.json({
      message: `Wallet has been ${wallet.isActive ? "enabled" : "disabled"}.`,
      wallet,
    });
  } catch (error) {
    res.status(500).json({ message: "Error toggling wallet status", error });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate({
        path: "walletId",
        populate: {
          path: "userId",
          select: "username email",
        },
      })
      .exec();

    const transactionsWithUserDetails = transactions.map((transaction) => ({
      _id: transaction._id,
      amount: transaction.amount,
      type: transaction.type,
      timestamp: transaction.timestamp,
      status: transaction.status,
      user: {
        username: transaction.walletId.userId.username,
        email: transaction.walletId.userId.email,
      },
    }));

    res.json(transactionsWithUserDetails);
  } catch (error) {
    res.status(500).json({ message: "Error fetching transactions", error });
  }
};

const getTransactionsByUser = async (req, res) => {
  const userId = req.user.id;
  const { type } = req.query;

  try {
    const transactions = await Transaction.find().populate("walletId").exec();

    const userTransactions = transactions.filter((transaction) => {
      return transaction.walletId.userId.toString() === userId;
    });

    const filteredTransactions = type
      ? userTransactions.filter(
          (transaction) => transaction.type.toLowerCase() === type.toLowerCase()
        )
      : userTransactions;

    res.json(filteredTransactions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching transactions for user", error });
  }
};

const getBanks = async (req, res) => {
  try {
    const response = await axios.get("https://api.paystack.co/bank", {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching banks from Paystack:", error);
    res
      .status(500)
      .json({ message: "Error fetching banks", error: error.message });
  }
};

module.exports = {
  createWallet,
  getWallet,
  getWallets,
  depositWallet,
  withdrawWallet,
  handleCreateCustomerAndAccount,
  toggleWalletStatus,
  getAllTransactions,
  getTransactionsByUser,
  getBanks,
};
