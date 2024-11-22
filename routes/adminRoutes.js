const express = require("express");
const {
  loginAdmin,
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
} = require("../controllers/adminController");
const {
  createWallet,
  depositWallet,
  getWallets,
  toggleWalletStatus,
  getAllTransactions,
} = require("../controllers/walletController");
const authUser = require("../middleware/authMiddleware");
const authAdmin = require("../middleware/adminMiddleware");
const router = express.Router();

router.post("/login", loginAdmin);
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

module.exports = router;
