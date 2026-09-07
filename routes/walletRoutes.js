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
  handlePaystackWebhook,
} = require("../controllers/walletController");
const auth = require("../middleware/authMiddleware");
const router = express.Router();
const admin = require('../middleware/adminMiddleware');
const subject = require('../middleware/walletSubject');
const financialLimit = require('../middleware/financialRateLimit');

// Wallet management routes
router.get("/", auth, getWallet);
router.get("/all", auth, admin, getWallets);
router.put("/:id/toggle-status", auth, admin, toggleWalletStatus);

// Deposit routes
router.post("/deposit", auth, (req, res) => res.status(410).json({ message: "Use verified payment checkout to fund your wallet." }));
router.post("/deposit/paystack/initiate", auth, financialLimit, subject, depositWalletWithPaystack);
router.post("/deposit/paystack/verify", auth, financialLimit, subject, verifyPaystackTransaction);
router.get("/deposit/paystack/callback", handlePaystackCallback);
router.post("/deposit/paystack/webhook", handlePaystackWebhook);
router.post("/deposit/paystack/confirm", auth, financialLimit, subject, depositPaystackWallet);

// Withdrawal routes
router.post("/withdraw", auth, financialLimit, subject, withdrawWallet);
router.post("/withdraw/paystack", auth, financialLimit, subject, withdrawWalletPaystack);

// Monnify routes (if needed)
router.post("/deposit/monnify/initiate", auth, financialLimit, subject, depositWalletWithMonnify);
router.post("/deposit/monnify/verify/:ref", auth, verifyMonnifyTransaction);
router.post("/withdraw/monnify", auth, financialLimit, subject, withdrawMonnifyWallet);
router.post("/withdraw/monnify/otp", auth, financialLimit, subject, withdrawMonnifyWalletOTP);

// Transaction routes
router.get("/transactions", auth, getTransactionsByUser);
router.get("/transactions/all", auth, admin, getAllTransactions);
router.get("/transactions/:requestId", auth, getTransactionDetails);

// Bank routes
router.get("/banks", auth, getBanks);

// Wallet Settings routes (Admin only)
router.get("/settings", auth, getWalletSettings);
router.put("/settings", auth, admin, updateWalletSettings);
router.post("/settings/reset", auth, admin, resetWalletSettings);

module.exports = router;
