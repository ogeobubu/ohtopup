const express = require("express");
const {
    createWallet,
    getWallet,
    depositWallet,
    withdrawWallet,
    handleCreateCustomerAndAccount
} = require("../controllers/walletController");
const auth = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", createWallet);
router.post("/create-dedicated-account", auth, handleCreateCustomerAndAccount);
router.get("/", auth, getWallet);
router.post("/deposit", auth, depositWallet);
router.post("/withdraw", auth, withdrawWallet);

module.exports = router;
