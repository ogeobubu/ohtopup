const express = require("express");
const {
  getWallet,
  withdrawWallet,
  handleCreateCustomerAndAccount,
} = require("../controllers/walletController");
const auth = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/create-dedicated-account", auth, handleCreateCustomerAndAccount);
router.get("/", auth, getWallet);
router.post("/withdraw", auth, withdrawWallet);

module.exports = router;
