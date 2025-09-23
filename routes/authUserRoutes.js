const express = require("express");
const { refreshToken } = require("../controllers/userController");

const router = express.Router();

// Refresh token endpoint
router.post("/refresh", refreshToken);

module.exports = router;