const express = require('express');
const router = express.Router();
const xController = require('../controllers/xController');

router.post('/post-to-x', xController.postTweet);
router.post('/trigger-repost', xController.triggerRepost);

module.exports = router;