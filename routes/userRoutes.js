const express = require("express");
const {
  createUser,
  verifyUser,
  resendVerificationCode,
  loginUser,
  forgotPassword,
  verifyOtpAndResetPassword,
  resendOtp,
  getUser,
  updateUser,
  softDeleteUser,
  deleteBankAccount
} = require("../controllers/userController");
const {
  getWallet,
  getTransactionsByUser,
  getBanks,
  withdrawWallet
} = require("../controllers/walletController");
const auth = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/create", createUser);
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
router.post("/withdraw", auth, withdrawWallet);

module.exports = router;
