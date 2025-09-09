const express = require("express");
const {
  buyAirtime,
  getPurchaseLimits,
  updatePurchaseLimits,
  getAirtimeSettings
} = require("../controllers/airtimeController");
const auth = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const router = express.Router();

router.post("/airtime", auth, buyAirtime);
router.get("/airtime/limits", auth, getPurchaseLimits);
router.put("/airtime/limits", auth, adminMiddleware, updatePurchaseLimits);
router.get("/airtime/settings", auth, getAirtimeSettings);

module.exports = router;