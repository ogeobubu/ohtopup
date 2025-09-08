const { DiceGame, DiceGameSettings } = require("../model/DiceGame");
const User = require("../model/User");
const Wallet = require("../model/Wallet");
const { createLog } = require("./systemLogController");
const { awardPoints } = require("./utilityController");

// Play dice game
const playDiceGame = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get game settings
    let settings = await DiceGameSettings.findOne();
    if (!settings) {
      // Create default settings if none exist
      settings = new DiceGameSettings();
      await settings.save();
    }

    // Check if game is enabled
    if (!settings.gameEnabled) {
      return res.status(400).json({
        message: "Dice game is currently disabled. Please try again later."
      });
    }

    // Check if maintenance mode is active
    if (settings.maintenanceMode) {
      return res.status(400).json({
        message: "Dice game is under maintenance. Please try again later."
      });
    }

    const entryFee = settings.entryFee;
    const winAmount = settings.winAmount;

    // Get user and wallet
    const user = await User.findById(userId);
    const wallet = await Wallet.findOne({ userId: userId });

    if (!user || !wallet) {
      return res.status(404).json({ message: "User or wallet not found" });
    }

    // Check if user has enough balance
    if (wallet.balance < settings.minBalanceRequired) {
      return res.status(400).json({
        message: `Insufficient balance. You need at least ₦${settings.minBalanceRequired} to play.`
      });
    }

    // Check daily game limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysGames = await DiceGame.countDocuments({
      user: userId,
      playedAt: { $gte: today, $lt: tomorrow }
    });

    if (todaysGames >= settings.maxDailyGames) {
      return res.status(400).json({
        message: `Daily game limit reached. You can play up to ${settings.maxDailyGames} games per day.`
      });
    }

    // Generate dice rolls
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    // Check if user wins (double 6)
    const isWin = dice1 === 6 && dice2 === 6;

    const winnings = isWin ? winAmount : 0;
    const gameResult = isWin ? "win" : "lose";

    // Deduct entry fee from user wallet
    wallet.balance -= entryFee;
    await wallet.save();

    // If user wins, award points only (no Naira added to wallet)
    if (isWin) {
      // Award 1000 points immediately for winning
      const pointsAwarded = await awardPoints(userId, 'dice_game_win', winAmount);
      console.log(`Awarded ${pointsAwarded} points to user ${user.username} for winning dice game`);

      // Get updated user data with new points
      const updatedUser = await User.findById(userId).select('points totalPoints weeklyPoints');
      console.log(`User ${user.username} new points balance:`, {
        points: updatedUser.points,
        totalPoints: updatedUser.totalPoints,
        weeklyPoints: updatedUser.weeklyPoints
      });
    }

    // Create game record
    const game = new DiceGame({
      user: userId,
      entryFee,
      dice1,
      dice2,
      isWin,
      winnings,
      gameResult,
    });

    await game.save();

    // Prepare log data
    const logData = {
      gameId: game._id,
      dice1,
      dice2,
      isWin,
      winnings,
      entryFee,
      newBalance: wallet.balance,
      timestamp: new Date()
    };

    // If user won, include points information in log
    if (isWin) {
      const updatedUser = await User.findById(userId).select('points totalPoints weeklyPoints');
      logData.pointsAwarded = 1000;
      logData.newPointsBalance = {
        currentPoints: updatedUser.points,
        totalPoints: updatedUser.totalPoints,
        weeklyPoints: updatedUser.weeklyPoints
      };
    }

    // Log the game transaction
    await createLog(
      isWin ? 'info' : 'warning',
      `Dice game ${gameResult}: User ${user.username} rolled ${dice1},${dice2} - ${isWin ? `Won 1000 points` : `Lost ₦${entryFee}`}`,
      'transaction',
      userId,
      user.email,
      logData,
      req
    );

    // Prepare response data
    const responseData = {
      message: isWin ? "Congratulations! You won 1000 points!" : "Better luck next time!",
      game: {
        id: game._id,
        dice1,
        dice2,
        isWin,
        winnings: isWin ? 1000 : 0, // Points won
        entryFee,
        gameResult,
        playedAt: game.playedAt,
      },
      newBalance: wallet.balance, // No change to wallet balance
    };

    // If user won, include points information
    if (isWin) {
      const updatedUser = await User.findById(userId).select('points totalPoints weeklyPoints');
      responseData.pointsAwarded = 1000;
      responseData.newPointsBalance = {
        currentPoints: updatedUser.points,
        totalPoints: updatedUser.totalPoints,
        weeklyPoints: updatedUser.weeklyPoints
      };
      responseData.transferStatus = "Points transferred immediately to your account";
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error("Error playing dice game:", error);

    // Log the error
    await createLog(
      'error',
      `Failed dice game attempt: ${error.message}`,
      'game',
      req.user?.id,
      req.user?.email,
      { error: error.message },
      req
    );

    res.status(500).json({ message: "Error playing dice game" });
  }
};

// Get user's game history
const getUserGameHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const games = await DiceGame.find({ user: userId })
      .sort({ playedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await DiceGame.countDocuments({ user: userId });

    res.status(200).json({
      games,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });

  } catch (error) {
    console.error("Error fetching user game history:", error);
    res.status(500).json({ message: "Error fetching game history" });
  }
};

// Get user's game statistics
const getUserGameStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const mongoose = require('mongoose');
    const stats = await DiceGame.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          totalWins: { $sum: { $cond: [{ $eq: ["$gameResult", "win"] }, 1, 0] } },
          totalLosses: { $sum: { $cond: [{ $eq: ["$gameResult", "lose"] }, 1, 0] } },
          totalWinnings: { $sum: "$winnings" },
          totalEntryFees: { $sum: "$entryFee" },
          winRate: {
            $avg: { $cond: [{ $eq: ["$gameResult", "win"] }, 1, 0] }
          }
        }
      }
    ]);

    const userStats = stats[0] || {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      totalWinnings: 0,
      totalEntryFees: 0,
      winRate: 0
    };

    res.status(200).json({
      stats: {
        ...userStats,
        winRate: Math.round(userStats.winRate * 100),
        netProfit: userStats.totalWinnings - userStats.totalEntryFees
      }
    });

  } catch (error) {
    console.error("Error fetching user game stats:", error);
    res.status(500).json({ message: "Error fetching game statistics" });
  }
};

// Admin: Get all games
const getAllGames = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, result } = req.query;

    let query = {};
    if (userId) query.user = userId;
    if (result) query.gameResult = result;

    const games = await DiceGame.find(query)
      .populate('user', 'username email')
      .sort({ playedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await DiceGame.countDocuments(query);

    res.status(200).json({
      games,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });

  } catch (error) {
    console.error("Error fetching all games:", error);
    res.status(500).json({ message: "Error fetching games" });
  }
};

// Admin: Get game statistics
const getGameStats = async (req, res) => {
  try {
    const stats = await DiceGame.aggregate([
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          totalWins: { $sum: { $cond: [{ $eq: ["$gameResult", "win"] }, 1, 0] } },
          totalLosses: { $sum: { $cond: [{ $eq: ["$gameResult", "lose"] }, 1, 0] } },
          totalWinnings: { $sum: "$winnings" },
          totalEntryFees: { $sum: "$entryFee" },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$gameResult", "lose"] },
                "$entryFee",
                0
              ]
            }
          }
        }
      }
    ]);

    const gameStats = stats[0] || {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      totalWinnings: 0,
      totalEntryFees: 0,
      totalRevenue: 0
    };

    // Get recent games for chart
    const recentGames = await DiceGame.find()
      .sort({ playedAt: -1 })
      .limit(50)
      .select('gameResult playedAt');

    res.status(200).json({
      stats: {
        ...gameStats,
        winRate: gameStats.totalGames > 0 ? Math.round((gameStats.totalWins / gameStats.totalGames) * 100) : 0,
        houseEdge: gameStats.totalGames > 0 ? Math.round((gameStats.totalRevenue / gameStats.totalEntryFees) * 100) : 0
      },
      recentGames
    });

  } catch (error) {
    console.error("Error fetching game stats:", error);
    res.status(500).json({ message: "Error fetching game statistics" });
  }
};

// Admin: Get management wallet balance (simulated)
const getManagementWallet = async (req, res) => {
  try {
    // Calculate total revenue from lost games
    const revenueStats = await DiceGame.aggregate([
      {
        $match: { gameResult: "lose" }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$entryFee" }
        }
      }
    ]);

    const totalRevenue = revenueStats[0]?.totalRevenue || 0;

    res.status(200).json({
      balance: totalRevenue,
      availableForWithdrawal: totalRevenue,
      totalGames: await DiceGame.countDocuments(),
      totalRevenue,
      lastUpdated: new Date()
    });

  } catch (error) {
    console.error("Error fetching management wallet:", error);
    res.status(500).json({ message: "Error fetching management wallet" });
  }
};

// Admin: Withdraw funds from management wallet using Paystack
const withdrawManagementFunds = async (req, res) => {
  try {
    const { amount, bankName, accountNumber, bankCode, accountName } = req.body;

    // Validate required fields
    if (!amount || !bankName || !accountNumber || !bankCode || !accountName) {
      return res.status(400).json({
        message: "All fields are required: amount, bankName, accountNumber, bankCode, accountName"
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    // Calculate available balance
    const revenueStats = await DiceGame.aggregate([
      {
        $match: { gameResult: "lose" }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$entryFee" }
        }
      }
    ]);

    const availableBalance = revenueStats[0]?.totalRevenue || 0;

    if (amount > availableBalance) {
      return res.status(400).json({
        message: `Insufficient funds. Available balance: ₦${availableBalance}`
      });
    }

    // Import required services
    const walletService = require("../services/walletService");

    // Check if this is the business owner's registered account
    const BUSINESS_OWNER_ACCOUNT = {
      accountNumber: "2147044567",
      bankCode: "033", // United Bank for Africa
      accountName: "ANDRETI OGECHUKWUKA OBUBU"
    };

    const isBusinessOwnerAccount =
      accountNumber === BUSINESS_OWNER_ACCOUNT.accountNumber &&
      bankCode === BUSINESS_OWNER_ACCOUNT.bankCode &&
      accountName.toLowerCase().trim() === BUSINESS_OWNER_ACCOUNT.accountName.toLowerCase().trim();

    if (isBusinessOwnerAccount) {
      // For business owner account, skip verification and use direct transfer
      console.log("Business owner account detected - using direct transfer");
    } else {
      // For third-party accounts, verify first
      console.log("Verifying third-party bank account:", { accountNumber, bankCode });
      const accountVerification = await walletService.verifyBankAccount(accountNumber, bankCode);

      if (!accountVerification || !accountVerification.account_name) {
        return res.status(400).json({
          message: "Invalid bank account details. Please check account number and bank code."
        });
      }

      // Verify account name matches
      const verifiedAccountName = accountVerification.account_name.toLowerCase().trim();
      const providedAccountName = accountName.toLowerCase().trim();

      if (verifiedAccountName !== providedAccountName) {
        return res.status(400).json({
          message: `Account name mismatch. Verified name: ${accountVerification.account_name}`,
          verifiedAccountName: accountVerification.account_name
        });
      }
    }

    let recipientCode;
    let transferDetails;
    let transactionReference;

    if (isBusinessOwnerAccount) {
      // For business owner account, use a different approach
      // We'll create a recipient but handle the transfer differently
      console.log("Creating recipient for business owner account");

      const recipientData = {
        type: "nuban",
        name: BUSINESS_OWNER_ACCOUNT.accountName,
        account_number: BUSINESS_OWNER_ACCOUNT.accountNumber,
        bank_code: BUSINESS_OWNER_ACCOUNT.bankCode,
        currency: "NGN",
        metadata: {
          withdrawalType: "management_funds_business_owner",
          description: "Dice Game Management Withdrawal - Business Owner"
        },
      };

      const recipientDetails = await walletService.createPaystackRecipient(recipientData);
      recipientCode = recipientDetails.recipient_code;

      // Generate unique reference
      transactionReference = `mgmt_withdraw_bo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // For business owner transfers, we might need to use a different source
      // Let's try with "balance" first, and if it fails, we can modify
      const transferData = {
        source: "balance",
        amount: amount * 100, // Paystack expects amount in kobo
        reference: transactionReference,
        recipient: recipientCode,
        reason: `Dice Game Management Withdrawal - ₦${amount} (Business Owner)`,
        metadata: {
          withdrawalType: "management_funds_business_owner",
          bankName: BUSINESS_OWNER_ACCOUNT.accountName,
          accountNumber: BUSINESS_OWNER_ACCOUNT.accountNumber,
          accountName: BUSINESS_OWNER_ACCOUNT.accountName
        },
      };

      try {
        transferDetails = await walletService.initiatePaystackTransfer(transferData);
      } catch (transferError) {
        // If transfer fails due to business restrictions, provide helpful message
        if (transferError.message.includes("third-party payouts") ||
            transferError.message.includes("starter business")) {
          throw new Error(
            "Business account upgrade required. Please upgrade your Paystack business account to Registered Business to enable withdrawals. Visit https://dashboard.paystack.com/settings/business to upgrade.",
            { cause: transferError.cause }
          );
        }
        throw transferError;
      }

    } else {
      // For third-party accounts, use the original logic
      const recipientData = {
        type: "nuban",
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
        metadata: {
          withdrawalType: "management_funds",
          description: "Dice Game Management Withdrawal"
        },
      };

      const recipientDetails = await walletService.createPaystackRecipient(recipientData);
      recipientCode = recipientDetails.recipient_code;

      // Generate unique reference
      transactionReference = `mgmt_withdraw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Initiate transfer
      const transferData = {
        source: "balance",
        amount: amount * 100, // Paystack expects amount in kobo
        reference: transactionReference,
        recipient: recipientCode,
        reason: `Dice Game Management Withdrawal - ₦${amount}`,
        metadata: {
          withdrawalType: "management_funds",
          bankName,
          accountNumber,
          accountName
        },
      };

      transferDetails = await walletService.initiatePaystackTransfer(transferData);
    }

    // Log the withdrawal
    await createLog(
      'info',
      `Management withdrawal initiated: ₦${amount} to ${accountName} (${accountNumber})`,
      'transaction',
      null, // No specific user for admin actions
      'admin@system.com',
      {
        amount,
        bankName,
        accountNumber,
        bankCode,
        accountName,
        recipientCode,
        transferReference: transactionReference,
        paystackTransferCode: transferDetails.transfer_code,
        timestamp: new Date()
      },
      req
    );

    res.status(200).json({
      message: "Withdrawal initiated successfully",
      transaction: {
        reference: transactionReference,
        amount,
        recipient: isBusinessOwnerAccount ? BUSINESS_OWNER_ACCOUNT.accountName : accountName,
        bank: isBusinessOwnerAccount ? "United Bank for Africa" : bankName,
        accountNumber: isBusinessOwnerAccount ? BUSINESS_OWNER_ACCOUNT.accountNumber : accountNumber,
        status: "pending",
        paystackTransferCode: transferDetails.transfer_code,
        isBusinessOwnerAccount
      },
      transferDetails,
      note: isBusinessOwnerAccount ?
        "Transfer initiated to business owner account. Funds should arrive within 5-15 minutes." :
        "Transfer initiated to third-party account. Processing may take 5-15 minutes."
    });

  } catch (error) {
    console.error("Error withdrawing management funds:", error);

    // Log the error
    await createLog(
      'error',
      `Management withdrawal failed: ${error.message}`,
      'transaction',
      null,
      'admin@system.com',
      {
        error: error.message,
        timestamp: new Date()
      },
      req
    );

    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    res.status(500).json({
      message: "Error processing withdrawal",
      error: error.message
    });
  }
};


// Get dice game settings
const getDiceGameSettings = async (req, res) => {
  try {
    let settings = await DiceGameSettings.findOne();
    if (!settings) {
      // Create default settings if none exist
      settings = new DiceGameSettings();
      await settings.save();
    }

    res.status(200).json({
      message: "Dice game settings retrieved successfully",
      settings
    });
  } catch (error) {
    console.error("Error fetching dice game settings:", error);
    res.status(500).json({ message: "Error fetching dice game settings" });
  }
};

// Update dice game settings
const updateDiceGameSettings = async (req, res) => {
  try {
    const { settings: newSettings } = req.body;

    if (!newSettings) {
      return res.status(400).json({ message: "Settings data is required" });
    }

    let settings = await DiceGameSettings.findOne();
    if (!settings) {
      settings = new DiceGameSettings();
    }

    // Update settings
    Object.keys(newSettings).forEach(key => {
      if (newSettings[key] !== undefined) {
        if (typeof newSettings[key] === 'object' && newSettings[key] !== null) {
          // Handle nested objects
          Object.keys(newSettings[key]).forEach(subKey => {
            if (newSettings[key][subKey] !== undefined) {
              settings[key][subKey] = newSettings[key][subKey];
            }
          });
        } else {
          settings[key] = newSettings[key];
        }
      }
    });

    await settings.save();

    // Log the settings update
    await createLog(
      'info',
      `Dice game settings updated by admin`,
      'admin',
      req.user?.id,
      req.user?.email,
      {
        updatedSettings: newSettings,
        timestamp: new Date()
      },
      req
    );

    res.status(200).json({
      message: "Dice game settings updated successfully",
      settings
    });
  } catch (error) {
    console.error("Error updating dice game settings:", error);
    res.status(500).json({ message: "Error updating dice game settings" });
  }
};

// Reset dice game settings to defaults
const resetDiceGameSettings = async (req, res) => {
  try {
    const defaultSettings = {
      gameEnabled: true,
      entryFee: 10,
      winAmount: 1000,
      maintenanceMode: false,
      minBalanceRequired: 10,
      maxDailyGames: 100,
      houseEdge: 97.22,
      notifications: {
        emailEnabled: true,
        largeWinAlert: true,
        suspiciousActivity: true
      },
      riskManagement: {
        maxLossPerHour: 50000,
        maxWinPerHour: 100000,
        autoShutdown: true
      }
    };

    let settings = await DiceGameSettings.findOne();
    if (!settings) {
      settings = new DiceGameSettings();
    }

    // Reset all settings to defaults
    Object.keys(defaultSettings).forEach(key => {
      if (typeof defaultSettings[key] === 'object' && defaultSettings[key] !== null) {
        Object.keys(defaultSettings[key]).forEach(subKey => {
          settings[key][subKey] = defaultSettings[key][subKey];
        });
      } else {
        settings[key] = defaultSettings[key];
      }
    });

    await settings.save();

    // Log the reset
    await createLog(
      'warning',
      `Dice game settings reset to defaults by admin`,
      'admin',
      req.user?.id,
      req.user?.email,
      {
        resetToDefaults: true,
        timestamp: new Date()
      },
      req
    );

    res.status(200).json({
      message: "Dice game settings reset to defaults",
      settings
    });
  } catch (error) {
    console.error("Error resetting dice game settings:", error);
    res.status(500).json({ message: "Error resetting dice game settings" });
  }
};

module.exports = {
  playDiceGame,
  getUserGameHistory,
  getUserGameStats,
  getAllGames,
  getGameStats,
  getManagementWallet,
  withdrawManagementFunds,
  getDiceGameSettings,
  updateDiceGameSettings,
  resetDiceGameSettings,
};