require("dotenv").config();
const Utility = require("../model/Utility");
const User = require("../model/User");
const Notification = require("../model/Notification");
const Service = require("../model/Service");
const Wallet = require("../model/Wallet");
const { Provider } = require("../model/Provider");
const axios = require("axios");
const { generateRequestId } = require("../utils");
const cron = require("node-cron");
const moment = require("moment");
const vtpassService = require("../services/vtpassService");
const clubkonnectService = require("../services/clubkonnectService");
const { createLog } = require("./systemLogController");

const vtpassWalletBalance = async (req, res) => {
  const VTPASS_URL = process.env.VTPASS_URL;
  const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
  const VTPASS_PUBLIC_KEY = process.env.VTPASS_PUBLIC_KEY;

  try {
    // Get VTPass balance
    const vtpassResponse = await axios.get(`${VTPASS_URL}/api/balance`, {
      headers: {
        "api-key": `${VTPASS_API_KEY}`,
        "public-key": `${VTPASS_PUBLIC_KEY}`,
      },
    });

    // Get ClubKonnect balance
    const clubkonnectProvider = await Provider.findOne({
      name: 'clubkonnect',
      isActive: true
    });

    let clubkonnectBalance = null;
    if (clubkonnectProvider) {
      clubkonnectService.setProvider(clubkonnectProvider);
      const clubkonnectResult = await clubkonnectService.checkWalletBalance();
      if (clubkonnectResult.success) {
        clubkonnectBalance = clubkonnectResult.balance;
      }
    }

    // Combine both balances
    const combinedBalance = {
      ...vtpassResponse.data.contents,
      clubkonnect: clubkonnectBalance
    };

    res.status(200).json(combinedBalance);
  } catch (error) {
    console.log(error);
    // Return VTPass balance even if ClubKonnect fails
    try {
      const vtpassResponse = await axios.get(`${VTPASS_URL}/api/balance`, {
        headers: {
          "api-key": `${VTPASS_API_KEY}`,
          "public-key": `${VTPASS_PUBLIC_KEY}`,
        },
      });
      res.status(200).json({
        ...vtpassResponse.data.contents,
        clubkonnect: null
      });
    } catch (vtpassError) {
      res.status(500).json({ error: "Failed to fetch wallet balances" });
    }
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

// Get data variations from selected provider
const getDataVariations = async (req, res) => {
  try {
    const { provider, serviceID } = req.query;

    if (!provider || !serviceID) {
      return res.status(400).json({
        message: "Provider and serviceID are required"
      });
    }

    // Get provider details
    const providerDoc = await Provider.findOne({
      name: provider,
      isActive: true,
      supportedServices: "data"
    });

    if (!providerDoc) {
      return res.status(404).json({
        message: "Provider not found or not active"
      });
    }

    let variations = [];

    if (providerDoc.name === 'vtpass') {
      // Get variations from VTPass
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

      variations = response.data.content.varations || [];
    } else if (providerDoc.name === 'clubkonnect') {
      // For Clubkonnect, return predefined data plans
      // This would need to be updated based on Clubkonnect's actual API
      variations = [
        {
          variation_code: "500",
          name: "500MB Data Plan",
          variation_amount: "150",
          fixedPrice: "0"
        },
        {
          variation_code: "1000",
          name: "1GB Data Plan",
          variation_amount: "300",
          fixedPrice: "0"
        },
        {
          variation_code: "2000",
          name: "2GB Data Plan",
          variation_amount: "500",
          fixedPrice: "0"
        },
        {
          variation_code: "5000",
          name: "5GB Data Plan",
          variation_amount: "1200",
          fixedPrice: "0"
        }
      ];
    }

    res.status(200).json({
      data: variations,
      provider: providerDoc.displayName
    });
  } catch (error) {
    console.error('Error fetching data variations:', error);
    res.status(500).json({
      message: 'Error fetching data variations'
    });
  }
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

  try {
    const response = await axios.post(`${VTPASS_URL}/api/merchant-verify`, data, {
      headers: {
        "api-key": `${VTPASS_API_KEY}`,
        "secret-key": `${VTPASS_SECRET_KEY}`,
      },
      timeout: 30000, // 30 second timeout
    });

    const newData = {
      Customer_Name: response.data.content.Customer_Name,
      Address: response.data.content.Address,
    };

    res.status(200).json({
      data: newData,
    });
  } catch (error) {
    console.error("VTPass meter verification error:", error.message);

    // For testing purposes, provide mock data when VTPass is unavailable
    if (process.env.NODE_ENV === 'development' && (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED')) {
      console.log("VTPass unavailable, using mock data for testing");

      // Mock response for testing
      const mockData = {
        Customer_Name: billersCode === '1111111111111' ? 'TESTMETER1' : 'JOHN DOE',
        Address: billersCode === '1111111111111' ? 'ABULE EGBA BU ABULE' : '123 MAIN STREET, LAGOS',
      };

      return res.status(200).json({
        data: mockData,
        mock: true, // Indicate this is mock data
        message: "Using test data - VTPass service unavailable"
      });
    }
    console.error("VTPass meter verification error:", error.message);

    // Handle different types of errors
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: "Electricity service is temporarily unavailable. Please try again in a few minutes.",
        error: "SERVICE_UNAVAILABLE"
      });
    }

    if (error.response) {
      // VTPass returned an error response
      const statusCode = error.response.status;
      const errorData = error.response.data;

      if (statusCode === 400) {
        return res.status(400).json({
          message: "Invalid meter number or service type. Please check your input.",
          error: "INVALID_REQUEST"
        });
      }

      if (statusCode === 401) {
        return res.status(503).json({
          message: "Service authentication failed. Please try again later.",
          error: "AUTHENTICATION_ERROR"
        });
      }

      return res.status(statusCode).json({
        message: errorData?.response_description || "Meter verification failed",
        error: "VTPASS_ERROR"
      });
    }

    // Network or other errors
    return res.status(500).json({
      message: "Unable to verify meter at this time. Please try again.",
      error: "NETWORK_ERROR"
    });
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

    const { type, requestId, userId } = req.query;

    let query = {};

    // Map frontend display names to backend stored types
    const typeMapping = {
      "Data Services": "data",
      "Airtime Recharge": "airtime",
      "Electricity Bill": "electricity",
      "TV Subscription": "cable"
    };

    if (type) {
      // Use mapped type if it exists, otherwise use the original type
      query.type = typeMapping[type] || type;
    }

    if (requestId) {
      query.requestId = { $regex: requestId, $options: "i" };
    }

    if (userId) {
      query.user = userId;
    }

    let transactions;

    if (user.role !== "admin") {
      // Add user filter to existing query instead of overwriting it
      query.user = user._id;
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
    const { period = 'weekly' } = req.body;

    // Calculate date range based on period
    let dateFilter = {};
    const currentDate = new Date();

    if (period === 'weekly') {
      // Current week (Sunday to Saturday)
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { $gte: startOfWeek };
    } else if (period === 'monthly') {
      // Current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      dateFilter = { $gte: startOfMonth };
    } else if (period === 'all-time') {
      // No date filter for all-time
      dateFilter = {};
    }

    // Enhanced ranking calculation with points system
    let matchStage = {};
    if (Object.keys(dateFilter).length > 0) {
      matchStage = { createdAt: dateFilter };
    }

    const rankings = await Utility.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: "$user",
          transactionCount: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalRevenue: { $sum: "$revenue" },
          successfulTransactions: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] }
          },
          failedTransactions: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
          },
          avgTransactionAmount: { $avg: "$amount" },
          lastTransactionDate: { $max: "$createdAt" },
          firstTransactionDate: { $min: "$createdAt" },
        },
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
          _id: "$userInfo._id",
          username: "$userInfo.username",
          email: "$userInfo.email",
          transactionCount: 1,
          totalAmount: 1,
          totalRevenue: 1,
          successfulTransactions: 1,
          failedTransactions: 1,
          avgTransactionAmount: 1,
          lastTransactionDate: 1,
          firstTransactionDate: 1,
          // Calculate points based on multiple factors
          points: {
            $add: [
              { $multiply: ["$transactionCount", 10] }, // 10 points per transaction
              { $multiply: ["$successfulTransactions", 5] }, // 5 bonus points for successful
              { $divide: ["$totalAmount", 100] }, // 1 point per ₦100 spent
              { $multiply: [
                { $divide: [
                  { $subtract: [new Date(), "$firstTransactionDate"] },
                  1000 * 60 * 60 * 24 * 30 // days since first transaction
                ]},
                2 // 2 points per month of activity
              ]}
            ]
          },
          // Calculate success rate
          successRate: {
            $multiply: [
              { $divide: ["$successfulTransactions", "$transactionCount"] },
              100
            ]
          }
        },
      },
      {
        $sort: { points: -1, transactionCount: -1, totalAmount: -1 },
      },
    ]).limit(10);

    const rankingsWithPositions = rankings.map((winner, index) => {
      const rank = index + 1;

      // Calculate business incentives based on rank and performance
      let discount = 0;
      let bonus = 0;
      let title = "Participant";

      if (rank === 1) {
        discount = 15;
        bonus = 500;
        title = "🏆 Champion";
      } else if (rank === 2) {
        discount = 12;
        bonus = 300;
        title = "🥈 Runner-up";
      } else if (rank === 3) {
        discount = 10;
        bonus = 200;
        title = "🥉 Third Place";
      } else if (rank <= 5) {
        discount = 5;
        bonus = 100;
        title = "Top 5";
      } else if (rank <= 10) {
        discount = 3;
        bonus = 50;
        title = "Top 10";
      }

      // Achievement badges based on performance
      const achievements = [];
      if (winner.transactionCount >= 50) achievements.push("Power User");
      if (winner.successRate >= 95) achievements.push("Reliable");
      if (winner.avgTransactionAmount >= 5000) achievements.push("High Value");
      if (winner.totalAmount >= 100000) achievements.push("VIP");

      return {
        username: winner.username.replace(/.(?=.{3})/g, "*"),
        transactionCount: winner.transactionCount,
        totalAmount: winner.totalAmount,
        points: Math.round(winner.points),
        successRate: Math.round(winner.successRate),
        rank: rank,
        discount: discount,
        bonus: bonus,
        title: title,
        achievements: achievements,
        // Additional metrics for admin view
        email: winner.email,
        successfulTransactions: winner.successfulTransactions,
        failedTransactions: winner.failedTransactions,
        avgTransactionAmount: Math.round(winner.avgTransactionAmount),
        lastTransactionDate: winner.lastTransactionDate,
      };
    });

    // Calculate next reset based on period
    let countdown = null;
    if (period === 'weekly') {
      const now = moment();
      const nextReset = moment().day(7).startOf("day");
      if (nextReset.isBefore(now)) {
        nextReset.add(1, "weeks");
      }
      countdown = nextReset.diff(now, "seconds");
    } else if (period === 'monthly') {
      const now = moment();
      const nextReset = moment().add(1, 'month').startOf('month');
      countdown = nextReset.diff(now, "seconds");
    }
    // No countdown for all-time

    res.status(200).json({
      rankings: rankingsWithPositions,
      countdown,
      period,
      totalParticipants: rankings.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching rankings:", error);
    res.status(500).json({ message: "Error fetching rankings" });
  }
};

const resetRankings = async (req, res) => {
  try {
    // Reset weekly points and achievements
    const result = await User.updateMany({}, {
      weeklyPoints: 0,
      weeklyTransactions: 0,
      achievements: []
    });

    // Log the reset action
    await createLog(
      'info',
      `User rankings reset completed`,
      'system',
      req.user?.id,
      req.user?.email,
      {
        resetType: 'weekly',
        usersAffected: result.modifiedCount,
        timestamp: new Date()
      },
      req
    );

    res.status(200).json({
      message: "User rankings have been reset.",
      usersAffected: result.modifiedCount
    });
  } catch (error) {
    console.error("Error resetting rankings:", error);

    // Log the error
    await createLog(
      'error',
      `Failed to reset user rankings: ${error.message}`,
      'system',
      req.user?.id,
      req.user?.email,
      { error: error.message },
      req
    );

    res.status(500).json({ message: "Error resetting rankings." });
  }
};

// Manual reset function for admins
const manualResetRankings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Reset weekly points and achievements
    const result = await User.updateMany({}, {
      weeklyPoints: 0,
      weeklyTransactions: 0,
      achievements: []
    });

    // Log the manual reset action
    await createLog(
      'info',
      `Manual user rankings reset completed`,
      'system',
      req.user?.id,
      req.user?.email,
      {
        resetType: 'manual',
        usersAffected: result.modifiedCount,
        timestamp: new Date()
      },
      req
    );

    console.log(`Manual ranking reset completed. Updated ${result.modifiedCount} users.`);

    res.status(200).json({
      message: "User rankings have been manually reset.",
      updatedUsers: result.modifiedCount
    });
  } catch (error) {
    console.error("Error during manual ranking reset:", error);

    // Log the error
    await createLog(
      'error',
      `Failed to manually reset user rankings: ${error.message}`,
      'system',
      req.user?.id,
      req.user?.email,
      { error: error.message },
      req
    );

    res.status(500).json({ message: "Error resetting rankings." });
  }
};

// Award points for user activities
const awardPoints = async (userId, activity, amount = 0) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    let pointsToAdd = 0;

    switch (activity) {
      case 'transaction':
        pointsToAdd = 10; // Base points for transaction
        if (amount >= 10000) pointsToAdd += 5; // Bonus for large transactions
        if (amount >= 50000) pointsToAdd += 10; // Extra bonus for very large
        break;
      case 'referral':
        pointsToAdd = 25; // Points for successful referral
        break;
      case 'login_streak':
        pointsToAdd = 5; // Daily login bonus
        break;
      case 'first_transaction':
        pointsToAdd = 50; // Welcome bonus
        break;
      case 'milestone_50':
        pointsToAdd = 100; // 50 transactions milestone
        break;
      case 'milestone_100':
        pointsToAdd = 200; // 100 transactions milestone
        break;
      case 'dice_game_win':
        pointsToAdd = amount || 1000; // Use the winAmount from admin settings, fallback to 1000
        break;
      default:
        pointsToAdd = 1;
    }

    // Update user points and achievements
    await User.findByIdAndUpdate(userId, {
      $inc: {
        points: pointsToAdd, // Update current points for wallet display
        totalPoints: pointsToAdd,
        weeklyPoints: pointsToAdd,
        weeklyTransactions: 1
      },
      $push: {
        achievements: {
          type: activity,
          points: pointsToAdd,
          date: new Date(),
          amount: amount
        }
      }
    });

    return pointsToAdd;
  } catch (error) {
    console.error('Error awarding points:', error);
    return 0;
  }
};

// Get user achievements and stats
const getUserAchievements = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('totalPoints weeklyPoints achievements weeklyTransactions');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate achievement stats
    const achievementStats = {
      totalAchievements: user.achievements.length,
      thisWeekPoints: user.weeklyPoints,
      totalPoints: user.totalPoints,
      weeklyTransactions: user.weeklyTransactions,
      recentAchievements: user.achievements.slice(-5).reverse(), // Last 5 achievements
    };

    res.status(200).json(achievementStats);
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({ message: 'Error fetching achievements' });
  }
};

// Export rankings to CSV
const exportRankingsToCSV = async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;

    // Log the export action
    await createLog(
      'info',
      `Rankings CSV export requested for period: ${period}`,
      'system',
      req.user?.id,
      req.user?.email,
      {
        exportType: 'rankings_csv',
        period,
        timestamp: new Date()
      },
      req
    );

    // Calculate date range based on period
    let dateFilter = {};
    const now = new Date();

    if (period === 'weekly') {
      // Current week (Sunday to Saturday)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { $gte: startOfWeek };
    } else if (period === 'monthly') {
      // Current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { $gte: startOfMonth };
    } else if (period === 'all-time') {
      // No date filter for all-time
      dateFilter = {};
    }

    // Get rankings data
    let matchStage = {};
    if (Object.keys(dateFilter).length > 0) {
      matchStage = { createdAt: dateFilter };
    }

    const rankings = await Utility.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: "$user",
          transactionCount: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalRevenue: { $sum: "$revenue" },
          successfulTransactions: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] }
          },
          failedTransactions: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
          },
          avgTransactionAmount: { $avg: "$amount" },
          lastTransactionDate: { $max: "$createdAt" },
          firstTransactionDate: { $min: "$createdAt" },
        },
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
          email: "$userInfo.email",
          transactionCount: 1,
          totalAmount: 1,
          totalRevenue: 1,
          successfulTransactions: 1,
          failedTransactions: 1,
          avgTransactionAmount: 1,
          lastTransactionDate: 1,
          firstTransactionDate: 1,
          // Calculate points based on multiple factors
          points: {
            $add: [
              { $multiply: ["$transactionCount", 10] }, // 10 points per transaction
              { $multiply: ["$successfulTransactions", 5] }, // 5 bonus points for successful
              { $divide: ["$totalAmount", 100] }, // 1 point per ₦100 spent
              { $multiply: [
                { $divide: [
                  { $subtract: [new Date(), "$firstTransactionDate"] },
                  1000 * 60 * 60 * 24 * 30 // days since first transaction
                ]},
                2 // 2 points per month of activity
              ]}
            ]
          },
          // Calculate success rate
          successRate: {
            $multiply: [
              { $divide: ["$successfulTransactions", "$transactionCount"] },
              100
            ]
          }
        },
      },
      {
        $sort: { points: -1, transactionCount: -1, totalAmount: -1 },
      },
    ]);

    // Generate CSV content
    const csvHeaders = [
      'Rank',
      'Username',
      'Email',
      'Transaction Count',
      'Total Amount (₦)',
      'Successful Transactions',
      'Failed Transactions',
      'Average Transaction (₦)',
      'Success Rate (%)',
      'Points',
      'Last Transaction Date',
      'First Transaction Date'
    ];

    const csvRows = rankings.map((user, index) => [
      index + 1,
      user.username,
      user.email,
      user.transactionCount,
      user.totalAmount.toFixed(2),
      user.successfulTransactions,
      user.failedTransactions,
      user.avgTransactionAmount.toFixed(2),
      user.successRate.toFixed(2),
      Math.round(user.points),
      user.lastTransactionDate ? new Date(user.lastTransactionDate).toISOString().split('T')[0] : 'N/A',
      user.firstTransactionDate ? new Date(user.firstTransactionDate).toISOString().split('T')[0] : 'N/A'
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=rankings-${period}-${new Date().toISOString().split('T')[0]}.csv`);

    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting rankings to CSV:', error);
    res.status(500).json({ message: 'Error exporting rankings' });
  }
};

// Requery transaction handler
const requeryTransactionHandler = async (req, res, next) => {
  try {
    const { request_id } = req.body;
    if (!request_id) {
      return res.status(400).json({ message: "Request ID is required." });
    }

    // Log the requery action
    await createLog(
      'info',
      `Transaction requery requested for request ID: ${request_id}`,
      'transaction',
      req.user?.id,
      req.user?.email,
      {
        requestId: request_id,
        action: 'requery',
        timestamp: new Date()
      },
      req
    );

    // Get active provider for requery
    const provider = await Provider.findOne({
      isActive: true,
      supportedServices: { $in: ["data", "airtime", "cable", "electricity"] }
    });

    if (!provider) {
      return res.status(503).json({ message: "No active provider available for requery." });
    }

    vtpassService.setProvider(provider);

    const transactionData = await vtpassService.requeryTransaction(request_id);

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

// Schedule weekly reset every Sunday at midnight
cron.schedule("0 0 * * 0", async () => {
  console.log("Running weekly ranking reset...");
  try {
    await resetRankings();
    console.log("Weekly ranking reset completed successfully");
  } catch (error) {
    console.error("Error during weekly ranking reset:", error);
  }
});

module.exports = {
  variationCodes,
  getServiceID,
  getDataVariations,
  variationTVCodes,
  verifySmartcard,
  verifyElecticity,
  getAllUtilityTransactions,
  getAnalytics,
  usersRank,
  resetRankings,
  manualResetRankings,
  exportRankingsToCSV,
  awardPoints,
  getUserAchievements,
  vtpassWalletBalance,
  requeryTransactionHandler
};
