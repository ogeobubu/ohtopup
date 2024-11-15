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
  softDeleteUser
} = require("../controllers/userController");
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
router.delete("/", auth, softDeleteUser)

module.exports = router;
