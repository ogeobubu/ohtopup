const express = require("express");
const {
  createUser,
  getReferrals,
  verifyUser,
  resendVerificationCode,
  loginUser,
  forgotPassword,
  verifyOtpAndResetPassword,
  resendOtp,
  getUser,
  updateUser,
  softDeleteUser,
  deleteBankAccount,
  verifyBankAccount,
  redeemPoints,
  changePin,
  googleAuth,
    googleAuthCallback,
  refreshToken
} = require("../controllers/userController");

const {
  getRates
} = require("../controllers/adminController");

const {
  getAllRewards,
  getRewardById,
  createReward,
  updateReward,
  deleteReward,
  assignRewardToUser,
  getUserRewards,
  redeemReward,
  getRewardAnalytics,
  getRewardSettings,
  updateRewardSettings,
  resetRewardSettings,
  getRewardSystemStats,
  bulkUpdateRewardStatus,
} = require("../controllers/rewardController");

const {
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
} = require("../controllers/diceGameController");

const {
  playBetDiceGame,
  getBetDiceHistory,
  getBetDiceStats,
  getAllBetDiceGames,
  getAdminBetDiceStats,
  getBetDiceSettings,
  updateBetDiceSettings,
  resetBetDiceSettings,
  forceResetBetDiceSettings,
} = require("../controllers/betDiceGameController");

const {
  getWallet,
  getTransactionsByUser,
  getTransactionDetails,
  getBanks,
  withdrawWallet,
  withdrawMonnifyWalletOTP,
  depositWalletWithPaystack,
  verifyPaystackTransaction,
  withdrawWalletPaystack,
  depositWalletWithMonnify,
  verifyMonnifyTransaction,
  withdrawMonnifyWallet,
  depositPaystackWallet,
} = require("../controllers/walletController");

const { buyAirtime } = require("../controllers/airtimeController")
const { buyData, getDataVariations, getDataSettings, getDataStats } = require("../controllers/dataController")
const {
  purchaseElectricity,
  getElectricitySettings,
  updateElectricitySettings,
  getCommissionRate,
  getAvailableDiscos
} = require("../controllers/electricityController")
const { purchaseCable } = require("../controllers/cableController")

const {
  variationCodes,
  getServiceID,
  variationTVCodes,
  verifySmartcard,
  verifyElecticity,
  getAllUtilityTransactions,
  usersRank,
  resetRankings,
  manualResetRankings,
  exportRankingsToCSV,
  getUserAchievements
} = require("../controllers/utilityController");

const {
  getNotifications,
  readNotification,
} = require("../controllers/notificationController");

const {
  getVariations,
  getSavedVariationsForPricing,
} = require("../controllers/variationController");

const {
  requeryTransactionHandler,
  getStoredEmails
} = require("../controllers/utilityController");

const {
  getActiveAirtimeNetworkProviders,
} = require("../controllers/providerController");

const { createWaitlist } = require("../controllers/waitlistController");

const { createTicket, replyTicket, getUserTickets } = require("../controllers/ticketController");

const {
  getAllTutorials,
  getTutorialById,
  getTutorialCategories,
} = require("../controllers/tutorialController");

const {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getNewsletterSubscribers,
} = require("../controllers/newsletterController");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const subject = require("../middleware/walletSubject");
const financialLimit = require("../middleware/financialRateLimit");
const router = express.Router();

router.post("/create", createUser);
router.get("/referrals", auth, getReferrals);
router.post("/verify", verifyUser);
router.post("/resend-code", resendVerificationCode);
router.post("/login", loginUser);
router.post("/forgot", forgotPassword);
router.post("/reset", verifyOtpAndResetPassword);
router.post("/resend-otp", resendOtp);
router.get("/", auth, getUser);
router.patch("/", auth, financialLimit, updateUser);
router.patch("/change-pin", auth, financialLimit, changePin);
router.delete("/", auth, softDeleteUser);


// Google OAuth routes
router.get("/auth/google", googleAuth);
router.get("/auth/google/callback", googleAuthCallback);

router.get("/wallet", auth, getWallet);
router.get("/transactions", auth, getTransactionsByUser);
router.get("/transactions/:requestId", auth, getTransactionDetails);
router.get("/banks", auth, getBanks);
router.post("/bank", auth, deleteBankAccount);
router.post("/withdraw", auth, financialLimit, subject, withdrawMonnifyWallet);
router.post("/withdraw/authorize", auth, financialLimit, subject, withdrawMonnifyWalletOTP);
router.post("/deposit", auth, financialLimit, subject, depositPaystackWallet);
router.get("/verify-payment/:ref", auth, verifyPaystackTransaction);
router.post("/verify-account", auth, verifyBankAccount);

// Test webhook with existing transaction (for testing purposes)

router.post("/airtime", auth, financialLimit, buyAirtime);
router.get("/airtime-providers", auth, getActiveAirtimeNetworkProviders);
// router.get("/data", auth, variationCodes);
router.get("/data", auth, getVariations);
router.post("/data", auth, financialLimit, buyData);
router.get("/data-variations", auth, getDataVariations);
router.get("/data/settings", auth, getDataSettings);
router.get("/data/stats", auth, getDataStats);
router.get("/service-id", getServiceID);
router.get("/cable", auth, variationTVCodes);
router.post("/cable/verify", auth, verifySmartcard);
router.post("/cable", auth, financialLimit, purchaseCable);
router.post("/electricity/verify", auth, verifyElecticity);
router.post("/electricity", auth, financialLimit, purchaseElectricity);
router.post("/electricity/requery", auth, requeryTransactionHandler);
router.get("/electricity/settings", auth, getElectricitySettings);
router.put("/electricity/settings", auth, admin, updateElectricitySettings);
router.get("/electricity/commission/:disco?", auth, getCommissionRate);
router.get("/electricity/discos", auth, getAvailableDiscos);
router.get("/electricity/limits/:disco?", auth, (req, res) => {
  // Import electricity settings service
  const electricitySettingsService = require("../services/electricitySettingsService");
  const disco = req.params.disco;

  electricitySettingsService.getAmountLimits(disco)
    .then(result => {
      if (result.success) {
        res.status(200).json({
          message: "Electricity limits retrieved successfully",
          minAmount: result.minAmount,
          maxAmount: result.maxAmount
        });
      } else {
        res.status(500).json({
          message: result.error || "Failed to retrieve electricity limits"
        });
      }
    })
    .catch(error => {
      console.error("Error getting electricity limits:", error);
      res.status(500).json({ message: "Error retrieving electricity limits" });
    });
});
router.get("/utility-transactions", auth, getAllUtilityTransactions);
router.get("/pricing", getSavedVariationsForPricing);

router.post("/redeem-points", auth, financialLimit, redeemPoints);

// User reward routes
router.get("/rewards", auth, getUserRewards);
router.post("/rewards/:rewardId/redeem", auth, redeemReward);

router.post("/waitlist", createWaitlist);

router.post("/rankings", usersRank);
router.post("/reset-rankings", auth, admin, resetRankings);
router.post("/admin/manual-reset-rankings", auth, admin, manualResetRankings);
router.get("/admin/export-rankings-csv", auth, admin, exportRankingsToCSV);
router.get("/achievements", auth, getUserAchievements);

router.get("/notifications", auth, getNotifications);
router.patch("/notification/:id", auth, readNotification);
router.post("/register-push-token", auth, (req, res) => {
  // Import notification service
  const notificationService = require("../services/notificationService");

  const { pushToken, platform } = req.body;
  const userId = req.user.id;

  notificationService.registerPushToken(userId, pushToken, platform)
    .then(result => {
      res.status(200).json({
        message: "Push token registered successfully",
        result
      });
    })
    .catch(error => {
      console.error("Error registering push token:", error);
      res.status(500).json({ message: "Failed to register push token" });
    });
});

// Web Push (browser) routes — Firebase Cloud Messaging
const webPushService = require("../services/webPushService");

router.get("/web-push/config", (req, res) => {
  res.json({
    projectId: process.env.FIREBASE_PROJECT_ID || null,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || null,
    appId: process.env.FIREBASE_APP_ID || null,
  });
});

router.post("/web-push/subscribe", auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: "Invalid subscription" });
    }
    const result = await webPushService.subscribe(
      req.user.id,
      subscription,
      req.headers["user-agent"]
    );
    res.json({ message: "Subscribed", id: result._id });
  } catch (error) {
    res.status(500).json({ message: "Failed to subscribe" });
  }
});

router.delete("/web-push/subscribe", auth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ message: "Endpoint required" });
    }
    await webPushService.unsubscribe(req.user.id, endpoint);
    res.json({ message: "Unsubscribed" });
  } catch (error) {
    res.status(500).json({ message: "Failed to unsubscribe" });
  }
});

router.get("/web-push/subscriptions", auth, async (req, res) => {
  try {
    const subs = await webPushService.getUserSubscriptions(req.user.id);
    res.json({ subscriptions: subs });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subscriptions" });
  }
});

router.post("/ticket", auth, createTicket);
router.get("/tickets", auth, getUserTickets);
router.post("/tickets/:id/reply", auth, replyTicket);

router.get("/rates", auth, getRates);

// Newsletter routes (public - no CSRF required for subscription)
router.post("/newsletter/subscribe", subscribeNewsletter);
router.post("/newsletter/unsubscribe", unsubscribeNewsletter);
router.get("/newsletter/subscribers", auth, admin, getNewsletterSubscribers);

// Reward management routes (admin only)
// Note: More specific routes must come before parameterized routes
router.get("/admin/rewards", auth, admin, getAllRewards);
router.get("/admin/rewards/analytics", auth, admin, getRewardAnalytics);

// Reward settings routes (must come before parameterized routes)
router.get("/admin/rewards/settings", auth, admin, getRewardSettings);
router.put("/admin/rewards/settings", auth, admin, updateRewardSettings);
router.post("/admin/rewards/settings/reset", auth, admin, resetRewardSettings);
router.get("/admin/rewards/stats", auth, admin, getRewardSystemStats);
router.post("/admin/rewards/bulk-update", auth, admin, bulkUpdateRewardStatus);

// Parameterized routes (must come after specific routes)
router.get("/admin/rewards/user/:userId", auth, admin, getUserRewards);
router.get("/admin/rewards/:id", auth, admin, getRewardById);
router.post("/admin/rewards", auth, admin, createReward);
router.put("/admin/rewards/:id", auth, admin, updateReward);
router.delete("/admin/rewards/:id", auth, admin, deleteReward);
router.post("/admin/rewards/assign", auth, admin, assignRewardToUser);
router.post("/admin/rewards/:rewardId/redeem", auth, admin, redeemReward);

// Dice Game Routes
router.post("/dice/play", auth, playDiceGame);
router.get("/dice/history", auth, getUserGameHistory);
router.get("/dice/stats", auth, getUserGameStats);

// Bet Dice Game Routes
router.post("/bet-dice/play", auth, playBetDiceGame);
router.get("/bet-dice/history", auth, getBetDiceHistory);
router.get("/bet-dice/stats", auth, getBetDiceStats);

// Admin dice game settings routes
router.get("/admin/dice/settings", auth, admin, getDiceGameSettings);
router.put("/admin/dice/settings", auth, admin, updateDiceGameSettings);
router.post("/admin/dice/settings/reset", auth, admin, resetDiceGameSettings);

// Admin Bet Dice Game Settings Routes
router.get("/admin/bet-dice/settings", auth, admin, getBetDiceSettings);
router.put("/admin/bet-dice/settings", auth, admin, updateBetDiceSettings);
router.post("/admin/bet-dice/settings/reset", auth, admin, resetBetDiceSettings);
router.post("/admin/bet-dice/settings/force-reset", auth, admin, forceResetBetDiceSettings);

// Admin Dice Game Routes
router.get("/admin/dice/games", auth, admin, getAllGames);
router.get("/admin/dice/stats", auth, admin, getGameStats);
router.get("/admin/dice/wallet", auth, admin, getManagementWallet);
router.post("/admin/dice/withdraw", auth, admin, withdrawManagementFunds);

// Admin Bet Dice Game Routes
router.get("/admin/bet-dice/games", auth, admin, getAllBetDiceGames);
router.get("/admin/bet-dice/stats", auth, admin, getAdminBetDiceStats);

// Admin Email Management Routes
router.get("/admin/stored-emails", auth, admin, getStoredEmails);
router.post("/admin/verify-bank-account", auth, admin, (req, res) => {
  // Import wallet service for bank verification
  const walletService = require("../services/walletService");
  const { accountNumber, bankCode } = req.body;

  walletService.verifyBankAccount(accountNumber, bankCode)
    .then(data => res.json(data))
    .catch(error => res.status(400).json({ message: error.message }));
});

// Tutorial routes (public - no auth required for viewing)
router.get("/tutorials", getAllTutorials);
router.get("/tutorials/:id", getTutorialById);
router.get("/tutorials/categories/list", getTutorialCategories);

module.exports = router;
