const express = require("express");
const {
  getWallet,
  getWallets,
  depositWallet,
  withdrawWallet,
  toggleWalletStatus,
  getAllTransactions,
  getTransactionsByUser,
  getTransactionDetails,
  getBanks,
  depositWalletWithPaystack,
  verifyPaystackTransaction,
  handlePaystackCallback,
  withdrawWalletPaystack,
  depositWalletWithMonnify,
  verifyMonnifyTransaction,
  withdrawMonnifyWallet,
  withdrawMonnifyWalletOTP,
  depositPaystackWallet,
  getWalletSettings,
  updateWalletSettings,
  resetWalletSettings,
} = require("../controllers/walletController");
const auth = require("../middleware/authMiddleware");
const router = express.Router();

// Wallet management routes
router.get("/", auth, getWallet);
router.get("/all", auth, getWallets);
router.put("/:id/toggle-status", auth, toggleWalletStatus);

// Deposit routes
router.post("/deposit", auth, depositWallet);
router.post("/deposit/paystack/initiate", auth, depositWalletWithPaystack);
router.post("/deposit/paystack/verify", auth, verifyPaystackTransaction);
router.get("/deposit/paystack/callback", handlePaystackCallback);
router.post("/deposit/paystack/confirm", auth, depositPaystackWallet);

// Withdrawal routes
router.post("/withdraw", auth, withdrawWallet);
router.post("/withdraw/paystack", auth, withdrawWalletPaystack);

// Monnify routes (if needed)
router.post("/deposit/monnify/initiate", auth, depositWalletWithMonnify);
router.post("/deposit/monnify/verify/:ref", auth, verifyMonnifyTransaction);
router.post("/withdraw/monnify", auth, withdrawMonnifyWallet);
router.post("/withdraw/monnify/otp", auth, withdrawMonnifyWalletOTP);

// Transaction routes
router.get("/transactions", auth, getTransactionsByUser);
router.get("/transactions/all", auth, getAllTransactions);
router.get("/transactions/:requestId", auth, getTransactionDetails);

// Bank routes
router.get("/banks", auth, getBanks);

// Wallet Settings routes (Admin only)
router.get("/settings", auth, getWalletSettings);
router.put("/settings", auth, updateWalletSettings);
router.post("/settings/reset", auth, resetWalletSettings);

module.exports = router;
