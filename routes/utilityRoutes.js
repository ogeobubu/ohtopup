const express = require("express");
const { buyAirtime } = require("../controllers/utilityController");
const auth = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/airtime", buyAirtime);

module.exports = router;
