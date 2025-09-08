const { createLog } = require('../systemLogController');
const User = require('../../model/User');
const Newsletter = require('../../model/Newsletter');
const emailService = require('../../services/emailService');

class EmailController {
  // Get email statistics
  async getEmailStats(req, res, next) {
    try {
      // Get total users
      const totalUsers = await User.countDocuments();

      // Get verified users
      const verifiedUsers = await User.countDocuments({ isVerified: true });

      // Get newsletter subscribers
      const newsletterSubscribers = await Newsletter.countDocuments();

      // Get active newsletter subscribers
      const activeSubscribers = await Newsletter.countDocuments({ isActive: true });

      // Calculate verification rate
      const verificationRate = totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0;

      // Calculate subscription rate
      const subscriptionRate = totalUsers > 0 ? Math.round((newsletterSubscribers / totalUsers) * 100) : 0;

      const stats = {
        totalUsers,
        verifiedUsers,
        newsletterSubscribers,
        activeSubscribers,
        verificationRate,
        subscriptionRate,
        unverifiedUsers: totalUsers - verifiedUsers,
        inactiveSubscribers: newsletterSubscribers - activeSubscribers
      };

      res.status(200).json({
        message: 'Email statistics retrieved successfully',
        stats
      });

    } catch (error) {
      await createLog(
        'error',
        `Failed to get email statistics: ${error.message}`,
        'admin',
        req.user?.id,
        req.user?.email,
        {
          errorType: 'email_stats_failed',
          errorStack: error.stack
        },
        req
      );

      next({
        status: 500,
        message: 'Failed to retrieve email statistics'
      });
    }
  }

  // Get email campaigns (placeholder for future implementation)
  async getEmailCampaigns(req, res, next) {
    try {
      // For now, return empty array as campaigns feature might be implemented later
      const campaigns = [];

      res.status(200).json({
        message: 'Email campaigns retrieved successfully',
        campaigns,
        total: 0
      });

    } catch (error) {
      await createLog(
        'error',
        `Failed to get email campaigns: ${error.message}`,
        'admin',
        req.user?.id,
        req.user?.email,
        {
          errorType: 'email_campaigns_failed',
          errorStack: error.stack
        },
        req
      );

      next({
        status: 500,
        message: 'Failed to retrieve email campaigns'
      });
    }
  }

  // Create email campaign (placeholder for future implementation)
  async createEmailCampaign(req, res, next) {
    try {
      const { subject, content, recipientType, scheduledDate } = req.body;

      // Validate required fields
      if (!subject || !content || !recipientType) {
        return next({
          status: 400,
          message: 'Subject, content, and recipient type are required'
        });
      }

      // For now, just return success as campaigns feature might be implemented later
      const campaign = {
        id: Date.now().toString(),
        subject,
        content,
        recipientType,
        scheduledDate,
        status: 'draft',
        createdAt: new Date(),
        createdBy: req.user.id
      };

      await createLog(
        'info',
        `Email campaign created: ${subject}`,
        'admin',
        req.user?.id,
        req.user?.email,
        {
          campaignId: campaign.id,
          recipientType,
          subject
        },
        req
      );

      res.status(201).json({
        message: 'Email campaign created successfully',
        campaign
      });

    } catch (error) {
      await createLog(
        'error',
        `Failed to create email campaign: ${error.message}`,
        'admin',
        req.user?.id,
        req.user?.email,
        {
          errorType: 'create_campaign_failed',
          errorStack: error.stack
        },
        req
      );

      next({
        status: 500,
        message: 'Failed to create email campaign'
      });
    }
  }

  // Send test email
  async sendTestEmail(req, res, next) {
    try {
      const { email, subject, content } = req.body;

      // Validate required fields
      if (!email || !subject || !content) {
        return next({
          status: 400,
          message: 'Email, subject, and content are required'
        });
      }

      // Send test email using email service
      const emailResult = await emailService.sendEmail({
        to: email,
        subject: `TEST: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Test Email</h2>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
              <h3>${subject}</h3>
              <div>${content}</div>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              This is a test email sent from the admin panel.
            </p>
          </div>
        `
      });

      if (emailResult.success) {
        await createLog(
          'info',
          `Test email sent successfully to: ${email}`,
          'admin',
          req.user?.id,
          req.user?.email,
          {
            testEmail: email,
            subject
          },
          req
        );

        res.status(200).json({
          message: 'Test email sent successfully',
          emailResult
        });
      } else {
        throw new Error(emailResult.error || 'Failed to send test email');
      }

    } catch (error) {
      await createLog(
        'error',
        `Failed to send test email: ${error.message}`,
        'admin',
        req.user?.id,
        req.user?.email,
        {
          errorType: 'send_test_email_failed',
          errorStack: error.stack
        },
        req
      );

      next({
        status: 500,
        message: 'Failed to send test email'
      });
    }
  }

  // Get email templates (placeholder for future implementation)
  async getEmailTemplates(req, res, next) {
    try {
      // For now, return basic templates as templates feature might be implemented later
      const templates = [
        {
          id: 'welcome',
          name: 'Welcome Email',
          subject: 'Welcome to OhTopUp!',
          description: 'Sent to new users after registration'
        },
        {
          id: 'transaction',
          name: 'Transaction Notification',
          subject: 'Transaction Completed',
          description: 'Sent after successful transactions'
        },
        {
          id: 'newsletter',
          name: 'Newsletter',
          subject: 'OhTopUp Newsletter',
          description: 'Regular newsletter for subscribers'
        }
      ];

      res.status(200).json({
        message: 'Email templates retrieved successfully',
        templates
      });

    } catch (error) {
      await createLog(
        'error',
        `Failed to get email templates: ${error.message}`,
        'admin',
        req.user?.id,
        req.user?.email,
        {
          errorType: 'email_templates_failed',
          errorStack: error.stack
        },
        req
      );

      next({
        status: 500,
        message: 'Failed to retrieve email templates'
      });
    }
  }

  // Get unsubscribe statistics
  async getUnsubscribeStats(req, res, next) {
    try {
      // Get total newsletter subscribers
      const totalSubscribers = await Newsletter.countDocuments();

      // Get active subscribers
      const activeSubscribers = await Newsletter.countDocuments({ isActive: true });

      // Get inactive/unsubscribed users
      const inactiveSubscribers = await Newsletter.countDocuments({ isActive: false });

      // Calculate unsubscribe rate
      const unsubscribeRate = totalSubscribers > 0 ? Math.round((inactiveSubscribers / totalSubscribers) * 100) : 0;

      const stats = {
        totalSubscribers,
        activeSubscribers,
        inactiveSubscribers,
        unsubscribeRate,
        retentionRate: 100 - unsubscribeRate
      };

      res.status(200).json({
        message: 'Unsubscribe statistics retrieved successfully',
        stats
      });

    } catch (error) {
      await createLog(
        'error',
        `Failed to get unsubscribe statistics: ${error.message}`,
        'admin',
        req.user?.id,
        req.user?.email,
        {
          errorType: 'unsubscribe_stats_failed',
          errorStack: error.stack
        },
        req
      );

      next({
        status: 500,
        message: 'Failed to retrieve unsubscribe statistics'
      });
    }
  }
}

module.exports = new EmailController();