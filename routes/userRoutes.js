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
} = require("../controllers/userController");

const {
  getWallet,
  getTransactionsByUser,
  getBanks,
  withdrawWallet,
  withdrawMonnifyWalletOTP,
  depositWalletWithPaystack,
  verifyPaystackTransaction,
  withdrawWalletPaystack,
  depositWalletWithMonnify,
  verifyMonnifyTransaction,
  withdrawMonnifyWallet,
} = require("../controllers/walletController");

const {
  buyAirtime,
  variationCodes,
  buyData,
  getServiceID,
  variationTVCodes,
  verifySmartcard,
  purchaseCable,
  verifyElecticity,
  purchaseElectricity,
  getAllUtilityTransactions,
  usersRank,
  resetRankings,
} = require("../controllers/utilityController");

const {
  getVariations,
  getSavedVariationsForPricing,
} = require("../controllers/variationController");

const { createWaitlist } = require("../controllers/waitlistController");

const auth = require("../middleware/authMiddleware");
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
router.patch("/", auth, updateUser);
router.delete("/", auth, softDeleteUser);

router.get("/wallet", auth, getWallet);
router.get("/transactions", auth, getTransactionsByUser);
router.get("/banks", auth, getBanks);
router.post("/bank", auth, deleteBankAccount);
router.post("/withdraw", auth, withdrawMonnifyWallet);
router.post("/withdraw/authorize", auth, withdrawMonnifyWalletOTP);
router.post("/deposit", auth, depositWalletWithMonnify);
router.get("/verify-payment/:ref", auth, verifyMonnifyTransaction);
router.post("/verify-account", auth, verifyBankAccount);

router.post("/airtime", auth, buyAirtime);
// router.get("/data", auth, variationCodes);
router.get("/data", auth, getVariations);
router.post("/data", auth, buyData);
router.get("/service-id", auth, getServiceID);
router.get("/cable", auth, variationTVCodes);
router.post("/cable/verify", auth, verifySmartcard);
router.post("/cable", auth, purchaseCable);
router.post("/electricity/verify", auth, verifyElecticity);
router.post("/electricity", auth, purchaseElectricity);
router.get("/utility-transactions", auth, getAllUtilityTransactions);
router.get("/pricing", getSavedVariationsForPricing);

router.post("/redeem-points", auth, redeemPoints);

router.post("/waitlist", createWaitlist);

router.post("/rankings", usersRank);
router.post("/reset-rankings", resetRankings);

module.exports = router;
