const Utility = require("../model/Utility");
const User = require("../model/User");
const Service = require("../model/Service");
const Wallet = require("../model/Wallet");
const axios = require("axios");
const { generateRequestId } = require("../utils");

const buyAirtime = async (req, res) => {
  const { serviceID, amount, phone } = req.body;

  const VTPASS_URL = process.env.VTPASS_URL;
  const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
  const VTPASS_SECRET_KEY = process.env.VTPASS_SECRET_KEY;

  const request_id = generateRequestId();

  if (!request_id || !serviceID || !amount || !phone) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const user = await User.findById(req.user.id);
  const wallet = await Wallet.findOne({ userId: req.user.id });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  if (!wallet) {
    return res.status(404).json({ message: "Wallet not found." });
  }

  if (wallet.balance < amount) {
    return res.status(400).json({ error: "Insufficient funds." });
  }

  if (!wallet.isActive) {
    return res
      .status(400)
      .json({ message: "Wallet is disabled. Transactions cannot be made." });
  }

  const data = {
    request_id,
    serviceID,
    amount,
    phone,
  };

  const response = await axios.post(`${VTPASS_URL}/api/pay`, data, {
    headers: {
      "api-key": `${VTPASS_API_KEY}`,
      "secret-key": `${VTPASS_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  const transactionStatus = response.data.content.transactions.status;
  const transactionType = response.data.content.transactions.type;
  const productName = response.data.content.transactions.product_name;
  const totalAmount = response.data.content.transactions.total_amount;
  const discount = response.data.content.transactions.discount;
  const commissionRate = response.data.content.transactions.commission;
  const paymentMethod = "api";

  const newTransaction = new Utility({
    requestId: request_id,
    serviceID,
    status: transactionStatus,
    type: transactionType,
    product_name: productName,
    amount,
    phone,
    revenue: totalAmount,
    user: user._id,
    transactionDate: new Date(),
    discount,
    commissionRate,
    paymentMethod,
  });

  if (transactionStatus === "failed") {
    try {
      await newTransaction.save();
      return res.status(400).json({
        message: "Transaction failed!",
      });
    } catch (err) {
      console.error("Error saving failed transaction:", err);
      return res.status(500).json({ message: "Error processing transaction." });
    }
  }

  wallet.balance -= amount;
  await wallet.save();

  try {
    await newTransaction.save();
    res.status(201).json({
      message: "Transaction successful!",
      transaction: newTransaction,
    });
  } catch (err) {
    console.error("Error processing transaction:", err);
    res.status(500).json({ message: "Error processing transaction." });
  }
};
const variationCodes = async (req, res) => {
  const { serviceID } = req.query;

  const VTPASS_URL = process.env.VTPASS_URL;
  const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
  const VTPASS_PUBLIC_KEY = process.env.VTPASS_PUBLIC_KEY;
  const VTPASS_SECRET_KEY = process.env.VTPASS_SECRET_KEY;

  const response = await axios.get(
    `${VTPASS_URL}/api/service-variations?serviceID=${serviceID}`,
    {
      headers: {
        "api-key": `${VTPASS_API_KEY}`,
        "public-key": `${VTPASS_PUBLIC_KEY}`,
      },
    }
  );

  res.status(200).json(response.data.content.varations);
};
const buyData = async (req, res) => {
  const { serviceID, billersCode, variation_code, amount, phone } = req.body;

  const VTPASS_URL = process.env.VTPASS_URL;
  const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
  const VTPASS_SECRET_KEY = process.env.VTPASS_SECRET_KEY;

  const request_id = generateRequestId();

  if (!request_id || !serviceID || !amount || !billersCode || !phone) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const user = await User.findById(req.user.id);
  const wallet = await Wallet.findOne({ userId: req.user.id });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  if (!wallet) {
    return res.status(404).json({ message: "Wallet not found." });
  }

  if (wallet.balance < amount) {
    return res.status(400).json({ error: "Insufficient funds." });
  }

  if (!wallet.isActive) {
    return res
      .status(400)
      .json({ message: "Wallet is disabled. Transactions cannot be made." });
  }

  const data = {
    request_id,
    serviceID,
    billersCode,
    variation_code,
    phone: billersCode,
  };

  const headers = {
    "api-key": VTPASS_API_KEY,
    "secret-key": VTPASS_SECRET_KEY,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(`${VTPASS_URL}/api/pay`, data, {
      headers,
    });

    const transactionStatus = response.data.content.transactions.status;
    const transactionType = response.data.content.transactions.type;
    const productName = response.data.content.transactions.product_name;
    const totalAmount = response.data.content.transactions.total_amount;
    const discount = response.data.content.transactions.discount;
    const commissionRate = response.data.content.transactions.commission;
    const paymentMethod = "api";

    const newTransaction = new Utility({
      requestId: request_id,
      serviceID,
      status: transactionStatus,
      type: transactionType,
      product_name: response.data.content.transactions.product_name,
      amount,
      phone: billersCode,
      revenue: totalAmount,
      user: user._id,
      transactionDate: new Date(),
      discount,
      commissionRate,
      paymentMethod,
    });

    if (transactionStatus === "failed") {
      await newTransaction.save();
      return res.status(400).json({ message: "Transaction failed!" });
    }

    wallet.balance -= amount;
    await wallet.save();
    await newTransaction.save();

    res.status(201).json({
      message: "Transaction successful!",
      transaction: newTransaction,
    });
  } catch (err) {
    console.error("Error processing transaction:", err);
    res.status(500).json({ message: "Error processing transaction." });
  }
};
const getServiceID = async (req, res) => {
  const VTPASS_URL = process.env.VTPASS_URL;
  const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
  const VTPASS_PUBLIC_KEY = process.env.VTPASS_PUBLIC_KEY;

  const { identifier } = req.query;

  const service = await Service.find({ name: identifier });
  const serviceAvailability = service[0]?.isAvailable;

  if (!serviceAvailability) {
    return res.status(500).json({
      error: "Service unavailable! Try again later.",
    });
  }

  const response = await axios.get(
    `${VTPASS_URL}/api/services?identifier=${identifier}`,
    {
      headers: {
        "api-key": `${VTPASS_API_KEY}`,
        "public-key": `${VTPASS_PUBLIC_KEY}`,
      },
    }
  );

  const newArray = [];

  for (let i = 0; i < response.data.content.length; i++) {
    newArray.push({
      serviceID: response.data.content[i].serviceID,
      name: response.data.content[i].name,
      minimum_amount: response.data.content[i].minimum_amount,
      maximum_amount: response.data.content[i].maximum_amount,
      image: response.data.content[i].image,
    });
  }

  res.status(200).json(newArray);
};
const variationTVCodes = async (req, res) => {
  const { serviceID } = req.query;

  const VTPASS_URL = process.env.VTPASS_URL;
  const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
  const VTPASS_PUBLIC_KEY = process.env.VTPASS_PUBLIC_KEY;
  const VTPASS_SECRET_KEY = process.env.VTPASS_SECRET_KEY;

  const response = await axios.get(
    `${VTPASS_URL}/api/service-variations?serviceID=${serviceID}`,
    {
      headers: {
        "api-key": `${VTPASS_API_KEY}`,
        "public-key": `${VTPASS_PUBLIC_KEY}`,
      },
    }
  );

  res.status(200).json(response.data.content.varations);
};
const verifySmartcard = async (req, res) => {
  const { billersCode, serviceID } = req.body;

  const VTPASS_URL = process.env.VTPASS_URL;
  const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
  const VTPASS_SECRET_KEY = process.env.VTPASS_SECRET_KEY;

  const data = {
    billersCode,
    serviceID,
  };

  const response = await axios.post(`${VTPASS_URL}/api/merchant-verify`, data, {
    headers: {
      "api-key": `${VTPASS_API_KEY}`,
      "secret-key": `${VTPASS_SECRET_KEY}`,
    },
  });

  const newData = {
    Customer_Name: response.data.content.Customer_Name,
    Due_Date: response.data.content.Due_Date,
    Current_Bouquet: response.data.content.Current_Bouquet,
    Current_Bouquet_Code: response.data.content.Current_Bouquet_Code,
    Renewal_Amount: response.data.content.Renewal_Amount,
  };

  res.status(200).json({
    data: newData,
  });
};
const purchaseCable = async (req, res) => {
  const {
    serviceID,
    billersCode,
    variation_code,
    amount,
    phone,
    subscription_type,
  } = req.body;

  const VTPASS_URL = process.env.VTPASS_URL;
  const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
  const VTPASS_SECRET_KEY = process.env.VTPASS_SECRET_KEY;

  const request_id = generateRequestId();

  if (!request_id || !serviceID || !amount || !phone) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const user = await User.findById(req.user.id);
  const wallet = await Wallet.findOne({ userId: req.user.id });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  if (!wallet) {
    return res.status(404).json({ message: "Wallet not found." });
  }

  if (wallet.balance < amount) {
    return res.status(400).json({ error: "Insufficient funds." });
  }

  if (!wallet.isActive) {
    return res
      .status(400)
      .json({ message: "Wallet is disabled. Transactions cannot be made." });
  }

  const data = {
    request_id,
    serviceID,
    billersCode,
    variation_code,
    amount,
    phone,
    subscription_type,
  };

  const headers = {
    "api-key": VTPASS_API_KEY,
    "secret-key": VTPASS_SECRET_KEY,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(`${VTPASS_URL}/api/pay`, data, {
      headers,
    });

    const transactionStatus = response.data.content.transactions.status;
    const transactionType = response.data.content.transactions.type;
    const productName = response.data.content.transactions.product_name;
    const totalAmount = response.data.content.transactions.total_amount;
    const discount = response.data.content.transactions.discount;
    const commissionRate = response.data.content.transactions.commission;
    const paymentMethod = "api";

    const newTransaction = new Utility({
      requestId: request_id,
      serviceID,
      status: transactionStatus,
      type: transactionType,
      product_name: productName,
      amount,
      phone: billersCode,
      revenue: totalAmount,
      user: user._id,
      transactionDate: new Date(),
      discount,
      commissionRate,
      paymentMethod,
    });

    if (response.data.content.transactions.status === "failed") {
      await newTransaction.save();
      return res.status(400).json({ message: "Transaction failed!" });
    }

    wallet.balance -= amount;
    await wallet.save();
    await newTransaction.save();

    res.status(201).json({
      message: "Transaction successful!",
      transaction: newTransaction,
    });
  } catch (err) {
    console.error("Error processing transaction:", err);
    res.status(500).json({ message: "Error processing transaction." });
  }
};
const verifyElecticity = async (req, res) => {
  const { billersCode, serviceID, type } = req.body;

  const VTPASS_URL = process.env.VTPASS_URL;
  const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
  const VTPASS_SECRET_KEY = process.env.VTPASS_SECRET_KEY;

  const data = {
    billersCode,
    serviceID,
    type,
  };

  const response = await axios.post(`${VTPASS_URL}/api/merchant-verify`, data, {
    headers: {
      "api-key": `${VTPASS_API_KEY}`,
      "secret-key": `${VTPASS_SECRET_KEY}`,
    },
  });

  const newData = {
    Customer_Name: response.data.content.Customer_Name,
    Address: response.data.content.Address,
  };

  res.status(200).json({
    data: newData,
  });
};
const purchaseElectricity = async (req, res) => {
  const { serviceID, billersCode, variation_code, amount, phone } = req.body;

  const VTPASS_URL = process.env.VTPASS_URL;
  const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
  const VTPASS_SECRET_KEY = process.env.VTPASS_SECRET_KEY;

  const request_id = generateRequestId();

  if (!request_id || !serviceID || !amount || !phone) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const user = await User.findById(req.user.id);
  const wallet = await Wallet.findOne({ userId: req.user.id });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  if (!wallet) {
    return res.status(404).json({ message: "Wallet not found." });
  }

  if (wallet.balance < amount) {
    return res.status(400).json({ error: "Insufficient funds." });
  }

  if (!wallet.isActive) {
    return res
      .status(400)
      .json({ message: "Wallet is disabled. Transactions cannot be made." });
  }

  const data = {
    request_id,
    serviceID,
    billersCode,
    variation_code,
    amount,
    phone,
  };

  const headers = {
    "api-key": VTPASS_API_KEY,
    "secret-key": VTPASS_SECRET_KEY,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(`${VTPASS_URL}/api/pay`, data, {
      headers,
    });

    const transactionStatus = response.data.content.transactions.status;
    const transactionType = response.data.content.transactions.type;
    const productName = response.data.content.transactions.product_name;
    const totalAmount = response.data.content.transactions.total_amount;
    const discount = response.data.content.transactions.discount;
    const commissionRate = response.data.content.transactions.commission;
    const paymentMethod = "api";

    const newTransaction = new Utility({
      requestId: request_id,
      serviceID,
      status: transactionStatus,
      type: transactionType,
      product_name: productName,
      amount,
      phone: billersCode,
      token: response.data.purchased_code,
      units: response.data.units,
      revenue: totalAmount,
      user: user._id,
      transactionDate: new Date(),
      discount,
      commissionRate,
      paymentMethod,
    });

    if (response.data.content.transactions.status === "failed") {
      await newTransaction.save();
      return res.status(400).json({ message: "Transaction failed!" });
    }

    wallet.balance -= amount;
    await wallet.save();
    await newTransaction.save();

    res.status(201).json({
      message: "Transaction successful!",
      transaction: newTransaction,
    });
  } catch (err) {
    console.error("Error processing transaction:", err);
    res.status(500).json({ message: "Error processing transaction." });
  }
};
const getAllUtilityTransactions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { type, requestId } = req.query;

    let query = {};

    if (type) {
      query.type = type;
    }

    if (requestId) {
      query.requestId = { $regex: requestId, $options: "i" };
    }

    let transactions;

    if (user.role !== "admin") {
      query = { user: user._id };
      if (type) {
        query.type = type;
      }
      if (requestId) {
        query.requestId = { $regex: requestId, $options: "i" };
      }
      transactions = await Utility.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      transactions = transactions.map((transaction) => {
        const {
          revenue,
          discount,
          commissionRate,
          paymentMethod,
          ...transactionWithoutRevenue
        } = transaction.toObject();
        return transactionWithoutRevenue;
      });

      const totalTransactions = await Utility.countDocuments(query);
      const totalPages = Math.ceil(totalTransactions / limit);

      return res.status(200).json({
        message: "User utility transactions fetched successfully!",
        transactions,
        currentPage: page,
        totalPages,
      });
    }

    transactions = await Utility.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalTransactions = await Utility.countDocuments(query);
    const totalPages = Math.ceil(totalTransactions / limit);

    res.status(200).json({
      message: "Utility transactions fetched successfully!",
      transactions,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Error fetching transactions." });
  }
};
const getAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admins only.",
      });
    }
    const overallAnalytics = await Utility.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$revenue" },
          totalGross: { $sum: "$amount" },
          totalCommission: { $sum: { $subtract: ["$amount", "$revenue"] } },
          totalTransactions: { $count: {} },
          totalDelivered: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          totalFailed: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
          totalPending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
    ]);

    // Aggregate for monthly analytics
    const monthlyAnalytics = await Utility.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          totalRevenue: { $sum: "$revenue" },
          totalGross: { $sum: "$amount" },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by month
      },
    ]);

    // Aggregate for yearly analytics
    const yearlyAnalytics = await Utility.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y", date: "$createdAt" } },
          totalRevenue: { $sum: "$revenue" },
          totalGross: { $sum: "$amount" },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by year
      },
    ]);

    if (overallAnalytics.length === 0) {
      return res.status(404).json({
        message: "No utility transactions found for analytics.",
      });
    }

    res.status(200).json({
      message: "Analytics fetched successfully!",
      overall: overallAnalytics[0],
      monthly: monthlyAnalytics,
      yearly: yearlyAnalytics,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Error fetching analytics." });
  }
};

module.exports = {
  buyAirtime,
  variationCodes,
  getServiceID,
  variationTVCodes,
  buyData,
  verifySmartcard,
  purchaseCable,
  verifyElecticity,
  purchaseElectricity,
  getAllUtilityTransactions,
  getAnalytics,
};
