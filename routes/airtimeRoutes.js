const express = require("express");
const { buyAirtime } = require("../controllers/airtimeController");
const auth = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/airtime", auth, buyAirtime);

module.exports = router;