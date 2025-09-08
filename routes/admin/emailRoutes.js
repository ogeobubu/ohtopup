const express = require('express');
const router = express.Router();
const emailController = require('../../controllers/admin/emailController');
const authUser = require('../../middleware/authMiddleware');
const authAdmin = require('../../middleware/adminMiddleware');


// Email statistics
router.get('/stats', authUser, authAdmin, emailController.getEmailStats);

// Email campaigns
router.get('/campaigns', authUser, authAdmin, emailController.getEmailCampaigns);
router.post('/campaigns', authUser, authAdmin, emailController.createEmailCampaign);

// Test email sending
router.post('/test-send', authUser, authAdmin, emailController.sendTestEmail);

// Email templates
router.get('/templates', authUser, authAdmin, emailController.getEmailTemplates);

// Unsubscribe statistics
router.get('/unsubscribe-stats', authUser, authAdmin, emailController.getUnsubscribeStats);

module.exports = router;