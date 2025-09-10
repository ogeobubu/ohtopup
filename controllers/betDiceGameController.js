const { BetDiceGame, BetDiceGameSettings } = require("../model/BetDiceGame");
const User = require("../model/User");
const Wallet = require("../model/Wallet");
const { createLog } = require("./systemLogController");
const { awardPoints } = require("./utilityController");
const emailService = require("../services/emailService");
const { betDiceManipulationEngine } = require("../utils/betDiceManipulation");

// Generate random odds based on difficulty level
const generateRandomOdds = (difficulty, settings) => {
  const level = settings.difficultyLevels[difficulty];
  if (!level || !level.enabled) {
    throw new Error(`Difficulty level ${difficulty} is not available`);
  }

  const min = level.oddsRange.min;
  const max = level.oddsRange.max;
  const randomOdds = Math.random() * (max - min) + min;
  return Math.round(randomOdds * 100) / 100; // Round to 2 decimal places
};

// Determine win condition based on difficulty and dice results
const determineWinCondition = (difficulty, dice, diceCount) => {
  switch (difficulty) {
    case "easy":
      // Any double (1,1 to 6,6)
      return dice.length >= 2 && dice[0] === dice[1];

    case "medium":
      // Double 4 or higher (4,4 ; 5,5 ; 6,6)
      return dice.length >= 2 && dice[0] === dice[1] && dice[0] >= 4;

    case "hard":
      // Double 5 or higher (5,5 ; 6,6)
      return dice.length >= 2 && dice[0] === dice[1] && dice[0] >= 5;

    case "expert":
      // Double 6 only (6,6)
      return dice.length >= 2 && dice[0] === 6 && dice[1] === 6;

    case "legendary":
      // Three of a kind (requires 3+ dice)
      if (diceCount < 3) return false;
      const firstValue = dice[0];
      return dice.every(die => die === firstValue);

    default:
      return false;
  }
};

// Get target combination description
const getTargetCombination = (difficulty) => {
  switch (difficulty) {
    case "easy": return "any_double";
    case "medium": return "double_4_plus";
    case "hard": return "double_5_plus";
    case "expert": return "double_6";
    case "legendary": return "three_of_kind";
    default: return "any_double";
  }
};

// Calculate expected value
const calculateExpectedValue = (betAmount, odds, winProbability) => {
  const probability = winProbability / 100;
  const potentialWin = betAmount * odds;
  const expectedValue = (probability * potentialWin) - ((1 - probability) * betAmount);
  return Math.round(expectedValue * 100) / 100;
};

// Generate fair random dice rolls
const generateDiceRolls = (count) => {
  const dice = [];
  for (let i = 0; i < count; i++) {
    dice.push(Math.floor(Math.random() * 6) + 1);
  }
  return dice;
};

// Play bet dice game
const playBetDiceGame = async (req, res) => {
  try {
    const userId = req.user.id;
    const { betAmount, odds, difficulty, diceCount } = req.body;

    // Validate required parameters
    if (!betAmount || !odds || !difficulty || !diceCount) {
      return res.status(400).json({
        message: "Missing required parameters: betAmount, odds, difficulty, diceCount"
      });
    }

    // Get game settings
    let settings = await BetDiceGameSettings.findOne();
    if (!settings) {
      // Create default settings if none exist
      settings = new BetDiceGameSettings();
      await settings.save();
      console.log(`Bet Dice Settings - Created new settings with maxDiceCount: ${settings.maxDiceCount}`);
    } else {
      console.log(`Bet Dice Settings - Retrieved existing settings with maxDiceCount: ${settings.maxDiceCount}`);
    }

    // Check if game is enabled
    if (!settings.gameEnabled) {
      return res.status(400).json({
        message: "Bet Dice game is currently disabled. Please try again later."
      });
    }

    // Check if maintenance mode is active
    if (settings.maintenanceMode) {
      return res.status(400).json({
        message: "Bet Dice game is under maintenance. Please try again later."
      });
    }

    // Validate difficulty level
    if (!settings.difficultyLevels[difficulty] || !settings.difficultyLevels[difficulty].enabled) {
      return res.status(400).json({
        message: `Difficulty level ${difficulty} is not available`
      });
    }

    // Validate bet amount
    if (betAmount < settings.minBetAmount || betAmount > settings.maxBetAmount) {
      return res.status(400).json({
        message: `Bet amount must be between ₦${settings.minBetAmount} and ₦${settings.maxBetAmount}`
      });
    }

    // Validate odds range
    const level = settings.difficultyLevels[difficulty];
    if (odds < level.oddsRange.min || odds > level.oddsRange.max) {
      return res.status(400).json({
        message: `Odds must be between ${level.oddsRange.min}x and ${level.oddsRange.max}x for ${difficulty} difficulty`
      });
    }

    // Validate dice count
    console.log(`Bet Dice Validation - diceCount: ${diceCount}, maxDiceCount: ${settings.maxDiceCount}, difficulty: ${difficulty}`);
    if (diceCount < 2 || diceCount > settings.maxDiceCount) {
      return res.status(400).json({
        message: `Dice count must be between 2 and ${settings.maxDiceCount}`
      });
    }

    // Get user and wallet
    const user = await User.findById(userId);
    const wallet = await Wallet.findOne({ userId: userId });

    if (!user || !wallet) {
      return res.status(404).json({ message: "User or wallet not found" });
    }

    // Check if user has enough balance
    const totalCost = betAmount + settings.entryFee;
    if (wallet.balance < totalCost) {
      return res.status(400).json({
        message: `Insufficient balance. You need at least ₦${totalCost} to play.`
      });
    }

    // Check daily bet limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysBets = await BetDiceGame.countDocuments({
      user: userId,
      playedAt: { $gte: today, $lt: tomorrow }
    });

    if (todaysBets >= settings.riskManagement.maxDailyBetsPerUser) {
      return res.status(400).json({
        message: `Daily bet limit reached. You can place up to ${settings.riskManagement.maxDailyBetsPerUser} bets per day.`
      });
    }

    // Generate dice rolls with manipulation if enabled
    let diceResult;
    if (settings.manipulation?.enabled) {
      // Initialize generator with seed if provided
      if (settings.manipulation.seed) {
        betDiceManipulationEngine.initializeGenerator(settings.manipulation.seed);
      }

      // Apply manipulation
      diceResult = await betDiceManipulationEngine.applyManipulation(
        settings.manipulation,
        difficulty,
        diceCount,
        userId,
        req
      );
    } else {
      // Fair play - no manipulation
      betDiceManipulationEngine.initializeGenerator(); // Reset to fair random
      diceResult = await betDiceManipulationEngine.applyManipulation(
        { mode: 'fair' },
        difficulty,
        diceCount,
        userId,
        req
      );
    }

    const { dice, isWin, manipulationApplied, manipulationType, error: manipulationError } = diceResult;
    const winnings = isWin ? betAmount * odds : 0;
    const gameResult = isWin ? "win" : "lose";

    // Calculate expected value and house edge
    const expectedValue = calculateExpectedValue(betAmount, odds, level.probability);
    const houseEdge = ((betAmount - expectedValue) / betAmount) * 100;

    // Deduct bet amount from wallet
    wallet.balance -= totalCost;
    await wallet.save();

    // Create game record
    const game = new BetDiceGame({
      user: userId,
      betAmount,
      odds,
      difficulty,
      diceCount,
      dice,
      targetCombination: getTargetCombination(difficulty),
      isWin,
      winnings,
      payout: winnings,
      gameResult,
      expectedValue,
      houseEdge,
    });

    await game.save();

    // If user wins, add winnings to wallet
    if (isWin) {
      wallet.balance += winnings;
      await wallet.save();

      // Note: Points are not awarded for winning bet games as per requirements
      console.log(`User ${user.username} won ₦${winnings} in bet dice game (no points awarded)`);

      // Send admin notification for large wins
      if (settings.notifications.largeWinAlert && winnings >= 10000) {
        try {
          await emailService.sendBetDiceWinAdminNotification(process.env.EMAIL_USER, {
            userName: user.username,
            userEmail: user.email,
            betAmount,
            odds,
            winnings,
            difficulty,
            diceCount,
            dice: dice.join(", "),
            gameTime: game.playedAt,
            message: `Large win: ₦${winnings.toLocaleString()}`
          });
        } catch (emailError) {
          console.error('Failed to send admin win notification:', emailError);
        }
      }
    }

    // Prepare log data
    const logData = {
      gameId: game._id,
      betAmount,
      odds,
      difficulty,
      diceCount,
      dice,
      isWin,
      winnings,
      newBalance: wallet.balance,
      expectedValue,
      houseEdge,
      manipulationApplied,
      manipulationType,
      timestamp: new Date()
    };

    // Log the game transaction with manipulation info
    const logLevel = manipulationApplied ? 'warning' : (isWin ? 'info' : 'warning');
    const logMessage = manipulationApplied
      ? `Bet dice game ${gameResult} [MANIPULATED:${manipulationType}]: User ${user.username} bet ₦${betAmount} at ${odds}x odds - ${isWin ? `Won ₦${winnings}` : `Lost ₦${betAmount}`}`
      : `Bet dice game ${gameResult}: User ${user.username} bet ₦${betAmount} at ${odds}x odds - ${isWin ? `Won ₦${winnings}` : `Lost ₦${betAmount}`}`;

    await createLog(
      logLevel,
      logMessage,
      manipulationApplied ? 'bet_dice_manipulation' : 'transaction',
      userId,
      user.email,
      logData,
      req
    );

    // Prepare response data
    const responseData = {
      message: isWin ? `Congratulations! You won ₦${winnings.toLocaleString()}!` : "Better luck next time!",
      game: {
        id: game._id,
        betAmount,
        odds,
        difficulty,
        diceCount,
        dice,
        targetCombination: getTargetCombination(difficulty),
        isWin,
        winnings,
        payout: winnings,
        gameResult,
        expectedValue,
        houseEdge,
        playedAt: game.playedAt,
      },
      newBalance: wallet.balance,
    };

    // If user won, include points information
    if (isWin) {
      const updatedUser = await User.findById(userId).select('points totalPoints weeklyPoints');
      responseData.pointsAwarded = Math.floor(winnings / 10);
      responseData.newPointsBalance = {
        currentPoints: updatedUser.points,
        totalPoints: updatedUser.totalPoints,
        weeklyPoints: updatedUser.weeklyPoints
      };
      responseData.transferStatus = "Winnings transferred immediately to your account";
    }

    // Include manipulation info only for admins (security)
    if (req.user?.role === 'admin' && manipulationApplied) {
      responseData.manipulationInfo = {
        applied: manipulationApplied,
        type: manipulationType,
        mode: settings.manipulation?.mode
      };
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error("Error playing bet dice game:", error);

    // Log the error
    await createLog(
      'error',
      `Failed bet dice game attempt: ${error.message}`,
      'game',
      req.user?.id,
      req.user?.email,
      { error: error.message },
      req
    );

    res.status(500).json({ message: "Error playing bet dice game" });
  }
};

// Get user's bet dice game history
const getBetDiceHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const games = await BetDiceGame.find({ user: userId })
      .sort({ playedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await BetDiceGame.countDocuments({ user: userId });

    res.status(200).json({
      games,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });

  } catch (error) {
    console.error("Error fetching bet dice game history:", error);
    res.status(500).json({ message: "Error fetching game history" });
  }
};

// Get user's bet dice game statistics
const getBetDiceStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const mongoose = require('mongoose');
    const stats = await BetDiceGame.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          totalWins: { $sum: { $cond: [{ $eq: ["$gameResult", "win"] }, 1, 0] } },
          totalLosses: { $sum: { $cond: [{ $eq: ["$gameResult", "lose"] }, 1, 0] } },
          totalBets: { $sum: "$betAmount" },
          totalWinnings: { $sum: "$winnings" },
          totalPayouts: { $sum: "$payout" },
          averageBetSize: { $avg: "$betAmount" },
          averageOdds: { $avg: "$odds" },
          largestWin: { $max: "$winnings" },
          winRate: {
            $avg: { $cond: [{ $eq: ["$gameResult", "win"] }, 1, 0] }
          }
        }
      }
    ]);

    // Get difficulty breakdown
    const difficultyStats = await BetDiceGame.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$difficulty",
          games: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ["$gameResult", "win"] }, 1, 0] } },
          totalBets: { $sum: "$betAmount" },
          totalWinnings: { $sum: "$winnings" }
        }
      },
      {
        $project: {
          games: 1,
          wins: 1,
          winRate: { $multiply: [{ $divide: ["$wins", "$games"] }, 100] },
          totalBets: 1,
          totalWinnings: 1,
          netProfit: { $subtract: ["$totalWinnings", "$totalBets"] }
        }
      }
    ]);

    const userStats = stats[0] || {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      totalBets: 0,
      totalWinnings: 0,
      totalPayouts: 0,
      averageBetSize: 0,
      averageOdds: 0,
      largestWin: 0,
      winRate: 0
    };

    // Get best win streak
    const games = await BetDiceGame.find({ user: userId }).sort({ playedAt: 1 });
    let currentStreak = 0;
    let bestStreak = 0;

    for (const game of games) {
      if (game.gameResult === 'win') {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    res.status(200).json({
      stats: {
        ...userStats,
        winRate: Math.round(userStats.winRate * 100),
        netProfit: userStats.totalWinnings - userStats.totalBets,
        bestWinStreak: bestStreak,
        difficultyStats,
        mostProfitableDifficulty: difficultyStats.length > 0
          ? difficultyStats.reduce((prev, current) =>
              (prev.netProfit > current.netProfit) ? prev : current
            )._id
          : 'N/A'
      }
    });

  } catch (error) {
    console.error("Error fetching bet dice game stats:", error);
    res.status(500).json({ message: "Error fetching game statistics" });
  }
};

// Admin: Get all bet dice games
const getAllBetDiceGames = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, result, difficulty } = req.query;

    let query = {};
    if (userId) query.user = userId;
    if (result) query.gameResult = result;
    if (difficulty) query.difficulty = difficulty;

    const games = await BetDiceGame.find(query)
      .populate('user', 'username email')
      .sort({ playedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await BetDiceGame.countDocuments(query);

    res.status(200).json({
      games,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });

  } catch (error) {
    console.error("Error fetching all bet dice games:", error);
    res.status(500).json({ message: "Error fetching games" });
  }
};

// Admin: Get bet dice game statistics
const getAdminBetDiceStats = async (req, res) => {
  try {
    const stats = await BetDiceGame.aggregate([
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          totalWins: { $sum: { $cond: [{ $eq: ["$gameResult", "win"] }, 1, 0] } },
          totalLosses: { $sum: { $cond: [{ $eq: ["$gameResult", "lose"] }, 1, 0] } },
          totalBets: { $sum: "$betAmount" },
          totalWinnings: { $sum: "$winnings" },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$gameResult", "lose"] },
                "$betAmount",
                0
              ]
            }
          },
          averageBetSize: { $avg: "$betAmount" },
          averageOdds: { $avg: "$odds" }
        }
      }
    ]);

    const gameStats = stats[0] || {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      totalBets: 0,
      totalWinnings: 0,
      totalRevenue: 0,
      averageBetSize: 0,
      averageOdds: 0
    };

    // Get recent games for chart
    const recentGames = await BetDiceGame.find()
      .sort({ playedAt: -1 })
      .limit(50)
      .select('gameResult playedAt betAmount winnings');

    // Get difficulty breakdown
    const difficultyBreakdown = await BetDiceGame.aggregate([
      {
        $group: {
          _id: "$difficulty",
          games: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ["$gameResult", "win"] }, 1, 0] } },
          totalBets: { $sum: "$betAmount" },
          totalWinnings: { $sum: "$winnings" }
        }
      }
    ]);

    // Get active players count
    const activePlayers = await BetDiceGame.distinct('user').then(users => users.length);

    // Get most popular difficulty
    const mostPopularDifficulty = difficultyBreakdown.length > 0
      ? difficultyBreakdown.reduce((prev, current) =>
          (prev.games > current.games) ? prev : current
        )._id
      : 'N/A';

    // Calculate average odds
    const averageOdds = gameStats.averageOdds || 0;

    // Determine risk tolerance based on average bet size
    let riskTolerance = 'Low';
    if (gameStats.averageBetSize > 500) riskTolerance = 'High';
    else if (gameStats.averageBetSize > 200) riskTolerance = 'Medium';
    else riskTolerance = 'Low';

    res.status(200).json({
      stats: {
        ...gameStats,
        winRate: gameStats.totalGames > 0 ? Math.round((gameStats.totalWins / gameStats.totalGames) * 100) : 0,
        houseEdge: gameStats.totalBets > 0 ? Math.round((gameStats.totalRevenue / gameStats.totalBets) * 100) : 0,
        difficultyBreakdown,
        activePlayers,
        mostPopularDifficulty,
        averageOdds,
        riskTolerance
      },
      recentGames
    });

  } catch (error) {
    console.error("Error fetching bet dice game stats:", error);
    res.status(500).json({ message: "Error fetching game statistics" });
  }
};

// Get bet dice game settings
const getBetDiceSettings = async (req, res) => {
  try {
    let settings = await BetDiceGameSettings.findOne();
    if (!settings) {
      // Create default settings if none exist
      settings = new BetDiceGameSettings();
      await settings.save();
    }

    res.status(200).json({
      message: "Bet dice game settings retrieved successfully",
      settings
    });
  } catch (error) {
    console.error("Error fetching bet dice game settings:", error);
    res.status(500).json({ message: "Error fetching bet dice game settings" });
  }
};

// Update bet dice game settings
const updateBetDiceSettings = async (req, res) => {
  try {
    const { settings: newSettings } = req.body;

    if (!newSettings) {
      return res.status(400).json({ message: "Settings data is required" });
    }

    let settings = await BetDiceGameSettings.findOne();
    if (!settings) {
      settings = new BetDiceGameSettings();
    }

    // Update settings with proper nested object handling
    Object.keys(newSettings).forEach(key => {
      if (newSettings[key] !== undefined) {
        if (typeof newSettings[key] === 'object' && newSettings[key] !== null) {
          // Ensure the parent object exists
          if (!settings[key]) {
            settings[key] = {};
          }

          // Handle nested objects
          Object.keys(newSettings[key]).forEach(subKey => {
            if (newSettings[key][subKey] !== undefined) {
              if (typeof newSettings[key][subKey] === 'object' && newSettings[key][subKey] !== null) {
                // Ensure the nested object exists
                if (!settings[key][subKey]) {
                  settings[key][subKey] = {};
                }

                // Handle deeply nested objects (like difficultyLevels)
                Object.keys(newSettings[key][subKey]).forEach(deepKey => {
                  if (newSettings[key][subKey][deepKey] !== undefined) {
                    settings[key][subKey][deepKey] = newSettings[key][subKey][deepKey];
                  }
                });
              } else {
                settings[key][subKey] = newSettings[key][subKey];
              }
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
      `Bet dice game settings updated by admin`,
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
      message: "Bet dice game settings updated successfully",
      settings
    });
  } catch (error) {
    console.error("Error updating bet dice game settings:", error);
    res.status(500).json({ message: "Error updating bet dice game settings" });
  }
};

// Reset bet dice game settings to defaults
const resetBetDiceSettings = async (req, res) => {
  try {
    const defaultSettings = {
      gameEnabled: true,
      maintenanceMode: false,
      minBetAmount: 10,
      maxBetAmount: 1000,
      entryFee: 0,
      maxDiceCount: 6,
      difficultyLevels: {
        easy: {
          enabled: true,
          oddsRange: { min: 1.2, max: 1.8 },
          probability: 16.67
        },
        medium: {
          enabled: true,
          oddsRange: { min: 2.0, max: 3.5 },
          probability: 8.33
        },
        hard: {
          enabled: true,
          oddsRange: { min: 3.0, max: 6.0 },
          probability: 5.56
        },
        expert: {
          enabled: true,
          oddsRange: { min: 5.0, max: 12.0 },
          probability: 2.78
        },
        legendary: {
          enabled: true,
          oddsRange: { min: 8.0, max: 20.0 },
          probability: 4.63
        }
      },
      notifications: {
        emailEnabled: true,
        largeWinAlert: true,
        suspiciousActivity: true,
        betLimitExceeded: true
      },
      riskManagement: {
        maxLossPerHour: 50000,
        maxWinPerHour: 100000,
        maxDailyBetsPerUser: 100,
        autoShutdown: true
      },
      houseEdge: 5.0,
      analytics: {
        trackBettingPatterns: true,
        generateReports: true,
        alertOnAnomalies: true
      },
      manipulation: {
        enabled: false,
        mode: 'fair',
        bias: 0.5,
        winProbability: 0.0278,
        seed: null,
        adminOnly: true,
        logManipulations: true,
        difficultySettings: {
          easy: { winProbability: 0.1667 },
          medium: { winProbability: 0.0833 },
          hard: { winProbability: 0.0556 },
          expert: { winProbability: 0.0278 },
          legendary: { winProbability: 0.0463 }
        }
      }
    };

    let settings = await BetDiceGameSettings.findOne();
    if (!settings) {
      settings = new BetDiceGameSettings();
    }

    // Reset all settings to defaults with proper nested object handling
    Object.keys(defaultSettings).forEach(key => {
      if (typeof defaultSettings[key] === 'object' && defaultSettings[key] !== null) {
        // Ensure the parent object exists
        if (!settings[key]) {
          settings[key] = {};
        }

        Object.keys(defaultSettings[key]).forEach(subKey => {
          if (typeof defaultSettings[key][subKey] === 'object' && defaultSettings[key][subKey] !== null) {
            // Ensure the nested object exists
            if (!settings[key][subKey]) {
              settings[key][subKey] = {};
            }

            Object.keys(defaultSettings[key][subKey]).forEach(deepKey => {
              settings[key][subKey][deepKey] = defaultSettings[key][subKey][deepKey];
            });
          } else {
            settings[key][subKey] = defaultSettings[key][subKey];
          }
        });
      } else {
        settings[key] = defaultSettings[key];
      }
    });

    await settings.save();

    // Log the reset
    await createLog(
      'warning',
      `Bet dice game settings reset to defaults by admin`,
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
      message: "Bet dice game settings reset to defaults",
      settings
    });
  } catch (error) {
    console.error("Error resetting bet dice game settings:", error);
    res.status(500).json({ message: "Error resetting bet dice game settings" });
  }
};

// Force reset bet dice settings (for emergency fixes)
const forceResetBetDiceSettings = async (req, res) => {
  try {
    // Only allow admins to force reset
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Delete existing settings
    await BetDiceGameSettings.deleteMany({});

    // Create new settings with correct defaults
    const newSettings = new BetDiceGameSettings();
    await newSettings.save();

    console.log(`Bet Dice Settings - Force reset completed. New maxDiceCount: ${newSettings.maxDiceCount}`);

    // Log the force reset
    await createLog(
      'warning',
      `Bet dice game settings force reset by admin`,
      'admin',
      req.user?.id,
      req.user?.email,
      {
        forceReset: true,
        newMaxDiceCount: newSettings.maxDiceCount,
        timestamp: new Date()
      },
      req
    );

    res.status(200).json({
      message: "Bet dice game settings force reset to defaults",
      settings: newSettings
    });
  } catch (error) {
    console.error("Error force resetting bet dice game settings:", error);
    res.status(500).json({ message: "Error force resetting bet dice game settings" });
  }
};

module.exports = {
  playBetDiceGame,
  getBetDiceHistory,
  getBetDiceStats,
  getAllBetDiceGames,
  getAdminBetDiceStats,
  getBetDiceSettings,
  updateBetDiceSettings,
  resetBetDiceSettings,
  forceResetBetDiceSettings,
};