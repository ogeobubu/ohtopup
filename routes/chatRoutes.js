const express = require("express");
const auth = require("../middleware/authMiddleware");

const { sendMessage, getMessages } = require("../controllers/chatController");

const router = express.Router();

router.post("/send-message", auth, sendMessage);

router.get("/messages/:userId", getMessages);

module.exports = router;
