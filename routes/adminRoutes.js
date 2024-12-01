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
  addPoint
} = require("../controllers/adminController");
const {
  createWallet,
  depositWallet,
  getWallets,
  toggleWalletStatus,
  getAllTransactions,
} = require("../controllers/walletController");
const {
  getAllUtilityTransactions,
  getAnalytics,
} = require("../controllers/utilityController");
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
router.get(
  "/utility-transactions",
  authUser,
  authAdmin,
  getAllUtilityTransactions
);
router.get("/utility-analytic", authUser, authAdmin, getAnalytics);

router.post("/add-point", authUser, authAdmin, addPoint);

module.exports = router;
