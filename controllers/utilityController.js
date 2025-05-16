const Utility = require("../model/Utility");
const User = require("../model/User");
const Notification = require("../model/Notification");
const Service = require("../model/Service");
const Wallet = require("../model/Wallet");
const axios = require("axios");
const { generateRequestId } = require("../utils");
const cron = require("node-cron");
const moment = require("moment");
const vtpassService = require("../services/vtpassService");

const vtpassWalletBalance = async (req, res) => {
  const VTPASS_URL = process.env.VTPASS_URL;
  const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
  const VTPASS_PUBLIC_KEY = process.env.VTPASS_PUBLIC_KEY;

  try {
    const response = await axios.get(`${VTPASS_URL}/api/balance`, {
      headers: {
        "api-key": `${VTPASS_API_KEY}`,
        "public-key": `${VTPASS_PUBLIC_KEY}`,
      },
    });
    res.status(200).json(response.data.contents);
  } catch (error) {
    console.log(error);
  }
};

const variationCodes = async (req, res) => {
  const { serviceID } = req.query;

  const VTPASS_URL = process.env.VTPASS_URL;
  const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
  const VTPASS_PUBLIC_KEY = process.env.VTPASS_PUBLIC_KEY;

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

  try {
    const response = await axios.post(
      `${VTPASS_URL}/api/merchant-verify`,
      data,
      {
        headers: {
          "api-key": `${VTPASS_API_KEY}`,
          "secret-key": `${VTPASS_SECRET_KEY}`,
        },
      }
    );

    const newData = {
      Customer_Name: response.data.content.Customer_Name,
      Due_Date: response.data.content.Due_Date,
      Current_Bouquet: response.data.content.Current_Bouquet,
      Current_Bouquet_Code: response.data.content.Current_Bouquet_Code,
      Renewal_Amount: response.data.content.Renewal_Amount,
    };

    return res.status(200).json({
      data: newData,
    });
  } catch (error) {
    console.error("Error verifying smartcard:", error);
    if (error.response) {
      return res.status(error.response.status).json({
        message:
          error.response.data.message ||
          "An error occurred while verifying the smartcard.",
      });
    } else if (error.request) {
      return res.status(500).json({
        message:
          "No response received from the smartcard verification service.",
      });
    } else {
      return res.status(500).json({
        message: "Error in smartcard verification request: " + error.message,
      });
    }
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

    const monthlyAnalytics = await Utility.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          totalRevenue: { $sum: "$revenue" },
          totalGross: { $sum: "$amount" },
        },
      },
      {
        $sort: { _id: 1 },
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
        $sort: { _id: 1 },
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

const usersRank = async (req, res) => {
  try {
    const rankings = await Utility.aggregate([
      {
        $group: {
          _id: "$user",
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: { transactionCount: -1 },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $project: {
          username: "$userInfo.username",
          transactionCount: 1,
        },
      },
    ]).limit(10);

    const rankingsWithPositions = rankings.map((winner, index) => ({
      username: winner.username.replace(/.(?=.{3})/g, "*"),
      transactionCount: winner.transactionCount,
      rank: index + 1,
    }));

    const now = moment();
    const nextReset = moment().day(7).startOf("day");
    if (nextReset.isBefore(now)) {
      nextReset.add(1, "weeks");
    }
    const countdown = nextReset.diff(now, "seconds");

    res.status(200).json({ rankings: rankingsWithPositions, countdown });
  } catch (error) {
    console.error("Error fetching rankings:", error);
    res.status(500).json({ message: "Error fetching rankings" });
  }
};

const resetRankings = async (req, res) => {
  try {
    await User.updateMany({}, { weeklyPoints: 0 });
    res.status(200).json({ message: "User rankings have been reset." });
  } catch (error) {
    console.error("Error resetting rankings:", error);
    res.status(500).json({ message: "Error resetting rankings." });
  }
};

const requeryTransactionHandler = async (req, res, next) => {
  try {
    const { request_id } = req.body;
    if (!request_id) {
      return res.status(400).json({ message: "Request ID is required." });
    }

    const VTPASS_URL = process.env.VTPASS_URL;
    const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
    const VTPASS_SECRET_KEY = process.env.VTPASS_SECRET_KEY;

    const transactionData = await vtpassService.requeryTransaction(
      VTPASS_URL,
      VTPASS_API_KEY,
      VTPASS_SECRET_KEY,
      request_id
    );

    const updatedTransaction = await Utility.findOneAndUpdate(
      { requestId: request_id },
      {
        status: transactionData.status,
      },
      { new: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    res.status(200).json({
      message: "Transaction requery successful.",
      transaction: updatedTransaction,
    });
  } catch (err) {
    next(err);
  }
};

// cron.schedule("0 0 * * 0", async () => {
//   await resetRankings();
// });

module.exports = {
  variationCodes,
  getServiceID,
  variationTVCodes,
  verifySmartcard,
  verifyElecticity,
  getAllUtilityTransactions,
  getAnalytics,
  usersRank,
  resetRankings,
  vtpassWalletBalance,
  requeryTransactionHandler
};
