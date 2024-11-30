const express = require("express");
const {
  getWallet,
  withdrawWallet,
} = require("../controllers/walletController");
const auth = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", auth, getWallet);
router.post("/withdraw", auth, withdrawWallet);

module.exports = router;
