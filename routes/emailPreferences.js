const express = require('express');
const router = express.Router();
const EmailPreferences = require('../model/EmailPreferences');
const emailUnsubscribeService = require('../services/emailUnsubscribeService');
const emailService = require('../services/emailService');
const { authenticateToken } = require('../middleware/auth');
const { createLog } = require('../controllers/systemLogController');

// Get user's email preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const preferences = await emailUnsubscribeService.getUserPreferences(req.user.id);

    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'Email preferences not found'
      });
    }

    res.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    console.error('Error getting email preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email preferences'
    });
  }
});

// Update user's email preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    const result = await emailUnsubscribeService.updateUserPreferences(req.user.id, updates);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      message: 'Email preferences updated successfully',
      data: result.preferences
    });

  } catch (error) {
    console.error('Error updating email preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email preferences'
    });
  }
});

// Handle unsubscribe via token (GET for email links)
router.get('/unsubscribe', async (req, res) => {
  try {
    const { token, type = 'all' } = req.query;

    if (!token) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Invalid Unsubscribe Link</h2>
            <p>The unsubscribe link is invalid or expired.</p>
            <p>Please contact support if you need assistance.</p>
          </body>
        </html>
      `);
    }

    const result = await emailUnsubscribeService.unsubscribe(token, type);

    if (!result.success) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Unsubscribe Failed</h2>
            <p>${result.error}</p>
            <p>The link may have expired or is invalid.</p>
          </body>
        </html>
      `);
    }

    // Send confirmation email
    const preferences = await EmailPreferences.findByUnsubscribeToken(token);
    if (preferences) {
      await emailUnsubscribeService.sendUnsubscribeConfirmation(
        preferences.userId.email, // This would need to be populated
        type
      );
    }

    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>Successfully Unsubscribed</h2>
          <p>You have been successfully unsubscribed from ${type === 'all' ? 'all' : type} emails.</p>
          <p>You can update your preferences anytime from your account settings.</p>
          <br>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/notifications"
             style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Update Preferences
          </a>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>Error</h2>
          <p>An error occurred while processing your unsubscribe request.</p>
          <p>Please try again later or contact support.</p>
        </body>
      </html>
    `);
  }
});

// Handle unsubscribe via POST (for forms)
router.post('/unsubscribe', async (req, res) => {
  try {
    const { token, type = 'all', email } = req.body;

    if (!token && !email) {
      return res.status(400).json({
        success: false,
        message: 'Token or email is required'
      });
    }

    let result;
    if (token) {
      result = await emailUnsubscribeService.unsubscribe(token, type);
    } else {
      // Handle email-based unsubscribe (less secure, but sometimes needed)
      return res.status(400).json({
        success: false,
        message: 'Please use the unsubscribe link from your email'
      });
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process unsubscribe request'
    });
  }
});

// Generate unsubscribe URL for a user
router.post('/generate-unsubscribe-url', authenticateToken, async (req, res) => {
  try {
    const { emailType = 'all' } = req.body;
    const unsubscribeUrl = await emailUnsubscribeService.generateUnsubscribeUrl(req.user.id, emailType);

    if (!unsubscribeUrl) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate unsubscribe URL'
      });
    }

    res.json({
      success: true,
      unsubscribeUrl
    });

  } catch (error) {
    console.error('Error generating unsubscribe URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate unsubscribe URL'
    });
  }
});

// Get unsubscribe statistics (admin only)
router.get('/unsubscribe-stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you might want to add proper admin check)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const stats = await emailUnsubscribeService.getUnsubscribeStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting unsubscribe stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unsubscribe statistics'
    });
  }
});

// Bulk unsubscribe (admin only)
router.post('/bulk-unsubscribe', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { userIds, emailType = 'all' } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: 'Valid user IDs array is required'
      });
    }

    const result = await emailUnsubscribeService.bulkUnsubscribe(userIds, emailType);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      message: `Successfully processed ${result.successful}/${result.total} unsubscribes`,
      data: result
    });

  } catch (error) {
    console.error('Error processing bulk unsubscribe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk unsubscribe'
    });
  }
});

// Verify email address
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const preferences = await EmailPreferences.findByVerificationToken(token);

    if (!preferences) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    await preferences.verifyEmail();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email'
    });
  }
});

// Send email verification
router.post('/send-verification', authenticateToken, async (req, res) => {
  try {
    const preferences = await EmailPreferences.findByUserId(req.user.id);

    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'Email preferences not found'
      });
    }

    if (preferences.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    const verificationToken = preferences.generateVerificationToken();
    await preferences.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

    await emailService.sendTemplate('email-verification', req.user.email, {
      verificationUrl,
      userName: req.user.firstName || 'User'
    });

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email'
    });
  }
});

module.exports = router;