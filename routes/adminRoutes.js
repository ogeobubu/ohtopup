const express = require("express");
const {
  loginAdmin,
  getAdminReferrals,
  getAdmin,
  updateAdmin,
  getAllUsers,
  getUserAnalytics,
  updateUser,
  createNotification,
  getAllNotifications,
  deleteNotification,
  createService,
  updateService,
  deleteService,
  getServices,
  addPoint,
  getRates,
  setRates
} = require("../controllers/adminController");
const {
  createWallet,
  depositWallet,
  getWallets,
  toggleWalletStatus,
  getAllTransactions,
  getTransactionDetails,
} = require("../controllers/walletController");
const {
  getAllUtilityTransactions,
  getAnalytics,
  variationCodes,
  vtpassWalletBalance,
  requeryTransactionHandler,
} = require("../controllers/utilityController");

const {
  getWaitlist,
  sendWaitlistEmails,
} = require("../controllers/waitlistController");

const {
  getPartyVariations,
  getVariations,
  saveVariations,
  toggleVariation,
} = require("../controllers/variationController");

const { getDataProviders } = require("../controllers/providerController");

const { readNotification } = require("../controllers/notificationController");

const {
  replyTicket,
  getTickets,
  updateTicket,
} = require("../controllers/ticketController");

const {
  generateMarketingContent,
} = require("../controllers/contentController");

const {
  sendNewsletter,
  getNewsletterSubscribers,
  getNewsletterStats,
  getNewsletterActivity,
} = require("../controllers/newsletterController");

const {
  getSystemLogs,
  getLogStats,
  cleanupLogs,
} = require("../controllers/systemLogController");

const {
  getAllProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider,
  setDefaultProvider,
  getActiveProviders,
  getDefaultProvider,
  testProviderConnection,
  getProviderAnalytics,
  bulkUpdateProviderStatus,
  getAllDataPlans,
  // Network Provider functions
  getAllNetworkProviders,
  createNetworkProvider,
  updateNetworkProvider,
  deleteNetworkProvider,
  toggleNetworkProviderStatus,
  getActiveNetworkProviders,
  setActiveProvider,
  getActiveProvider,
} = require("../controllers/providerController");

const {
  getAllSelectedPlans,
  getSelectedPlansForUsers,
  selectDataPlan,
  deselectDataPlan,
  updateSelectedPlan,
  bulkUpdateSelectedPlans,
  getSelectedPlansStats,
} = require("../controllers/selectedDataPlanController");

const {
  getElectricitySettings,
  updateElectricitySettings,
  resetElectricitySettings,
  getAvailableDiscos,
} = require("../controllers/electricityController");

const authUser = require("../middleware/authMiddleware");
const authAdmin = require("../middleware/adminMiddleware");

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/referrals", getAdminReferrals);
router.get("/", authUser, authAdmin, getAdmin);
router.patch("/", authUser, authAdmin, updateAdmin);
router.get("/users", authUser, authAdmin, getAllUsers);
router.get("/users/analytics", getUserAnalytics);
router.patch("/users/:id", authUser, authAdmin, updateUser);
router.post("/notifications", authUser, authAdmin, createNotification);
router.get("/notifications", authUser, authAdmin, getAllNotifications);
router.delete("/notifications/:id", authUser, authAdmin, deleteNotification);
router.post("/services", authUser, authAdmin, createService);
router.patch("/services/:id", authUser, authAdmin, updateService);
router.delete("/services/:id", authUser, authAdmin, deleteService);
router.get("/services", authUser, getServices);
router.post("/wallet", authUser, authAdmin, createWallet);
router.post("/wallet/deposit", authUser, authAdmin, depositWallet);
router.get("/wallets", authUser, authAdmin, getWallets);
router.patch("/wallets/:id/toggle", authUser, authAdmin, toggleWalletStatus);
router.get("/transactions", authUser, authAdmin, getAllTransactions);
router.get("/transactions/:requestId", authUser, authAdmin, getTransactionDetails);
router.get(
  "/utility-transactions",
  authUser,
  authAdmin,
  getAllUtilityTransactions
);
router.post(
  "/requery-transaction",
  authUser,
  authAdmin,
  requeryTransactionHandler
);
router.get("/utility-analytic", authUser, authAdmin, getAnalytics);

router.post("/add-point", authUser, authAdmin, addPoint);

router.get("/waitlist", authUser, authAdmin, getWaitlist);
router.post("/waitlist/send", authUser, authAdmin, sendWaitlistEmails);

router.get("/data", authUser, authAdmin, getPartyVariations);
router.get("/data/variations", authUser, authAdmin, getVariations);
router.post("/save-data", authUser, authAdmin, saveVariations);
router.patch("/data/toggle", authUser, authAdmin, toggleVariation);

router.get("/tickets", authUser, authAdmin, getTickets); 
router.post("/tickets/:id/reply", authUser, authAdmin, replyTicket);
router.patch("/tickets/:id", authUser, authAdmin, updateTicket);

router.get("/rates", authUser, authAdmin, getRates);
router.post("/rates", authUser, authAdmin, setRates);

router.patch("/notification/:id", authUser, authAdmin, readNotification);

router.get("/ai/random-content", authUser, authAdmin, generateMarketingContent);

router.get("/utility-balance", authUser, authAdmin, vtpassWalletBalance);

// Newsletter routes
router.post("/newsletter/send", sendNewsletter);
router.get("/newsletter/subscribers", getNewsletterSubscribers);
router.get("/newsletter/stats", authUser, authAdmin, getNewsletterStats);
router.get("/newsletter/activity", authUser, authAdmin, getNewsletterActivity);

// System log routes
router.get("/logs", authUser, authAdmin, getSystemLogs);
router.get("/logs/stats", authUser, authAdmin, getLogStats);
router.delete("/logs/cleanup", authUser, authAdmin, cleanupLogs);

// Provider management routes
router.get("/providers", authUser, authAdmin, getAllProviders);
router.get("/providers/active", authUser, authAdmin, getActiveProviders);
router.get("/providers/default", authUser, authAdmin, getDefaultProvider);
router.get("/providers/analytics", authUser, authAdmin, getProviderAnalytics);
router.get("/providers/data-plans", authUser, authAdmin, getAllDataPlans);
router.get("/providers/:id", authUser, authAdmin, getProviderById);
router.post("/providers", authUser, authAdmin, createProvider);
router.put("/providers/:id", authUser, authAdmin, updateProvider);
router.delete("/providers/:id", authUser, authAdmin, deleteProvider);
router.patch("/providers/:id/default", authUser, authAdmin, setDefaultProvider);
router.patch("/providers/:id/active", authUser, authAdmin, setActiveProvider);
router.post("/providers/:id/test", authUser, authAdmin, testProviderConnection);
router.post("/providers/bulk-update", authUser, authAdmin, bulkUpdateProviderStatus);

// Selected Data Plans routes
router.get("/selected-data-plans", authUser, authAdmin, getAllSelectedPlans);
router.get("/selected-data-plans/stats", authUser, authAdmin, getSelectedPlansStats);
router.post("/selected-data-plans", authUser, authAdmin, selectDataPlan);
router.delete("/selected-data-plans/:planId", authUser, authAdmin, deselectDataPlan);
router.put("/selected-data-plans/:planId", authUser, authAdmin, updateSelectedPlan);
router.post("/selected-data-plans/bulk", authUser, authAdmin, bulkUpdateSelectedPlans);

// Public route for users to get selected plans
router.get("/user/selected-data-plans", getSelectedPlansForUsers);

// Network Provider management routes
router.get("/network-providers", authUser, authAdmin, getAllNetworkProviders);
router.get("/network-providers/active", authUser, authAdmin, getActiveNetworkProviders);
router.get("/network-providers/:id", authUser, authAdmin, getProviderById);
router.post("/network-providers", authUser, authAdmin, createNetworkProvider);
router.put("/network-providers/:id", authUser, authAdmin, updateNetworkProvider);
router.delete("/network-providers/:id", authUser, authAdmin, deleteNetworkProvider);
router.patch("/network-providers/:id/toggle", authUser, authAdmin, toggleNetworkProviderStatus);

// Active provider route
router.get("/active-provider", authUser, authAdmin, getActiveProvider);

// Public route for getting data providers (for user selection)
router.get("/data-providers", getActiveNetworkProviders);

// Electricity Settings routes
router.get("/electricity/settings", authUser, authAdmin, getElectricitySettings);
router.put("/electricity/settings", authUser, authAdmin, updateElectricitySettings);
router.post("/electricity/settings/reset", authUser, authAdmin, resetElectricitySettings);
router.get("/electricity/discos", authUser, authAdmin, getAvailableDiscos);

module.exports = router;
