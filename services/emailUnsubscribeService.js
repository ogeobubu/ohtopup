const { emailLayout, escapeHtml } = require('./email/layout');
const EmailPreferences = require('../model/EmailPreferences');
const { createLog } = require('../controllers/systemLogController');
const emailService = require('./emailService');
require('dotenv').config();

class EmailUnsubscribeService {
  // Process unsubscribe request
  async unsubscribe(token, emailType = 'all') {
    try {
      // Find user by unsubscribe token
      const preferences = await EmailPreferences.findByUnsubscribeToken(token);

      if (!preferences) {
        return {
          success: false,
          error: 'Invalid or expired unsubscribe token'
        };
      }

      // Update preferences based on email type
      switch (emailType) {
        case 'all':
          preferences.transactionEmails = false;
          preferences.promotionalEmails = false;
          preferences.newsletterEmails = false;
          preferences.accountEmails = false;
          preferences.systemEmails = false;
          preferences.referralEmails = false;
          preferences.summaryEmails = false;
          break;

        case 'promotional':
          preferences.promotionalEmails = false;
          preferences.newsletterEmails = false;
          break;

        case 'transaction':
          preferences.transactionEmails = false;
          break;

        case 'newsletter':
          preferences.newsletterEmails = false;
          break;

        default:
          return {
            success: false,
            error: 'Invalid email type specified'
          };
      }

      await preferences.save();

      // Log the unsubscribe action
      await createLog('info', `User unsubscribed from ${emailType} emails`, 'system', preferences.userId, null, {
        emailType,
        userId: preferences.userId
      });

      return {
        success: true,
        message: `Successfully unsubscribed from ${emailType} emails`,
        emailType
      };

    } catch (error) {
      console.error('Error processing unsubscribe:', error);
      return {
        success: false,
        error: 'Failed to process unsubscribe request'
      };
    }
  }

  // Generate unsubscribe URL for a user
  async generateUnsubscribeUrl(userId, emailType = 'all') {
    try {
      const preferences = await EmailPreferences.findByUserId(userId);

      if (!preferences) {
        // Create default preferences if they don't exist
        const newPreferences = await EmailPreferences.createDefaultPreferences(userId);
        newPreferences.generateUnsubscribeToken();
        await newPreferences.save();
        return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe?token=${newPreferences.unsubscribeToken}&type=${emailType}`;
      }

      // Generate token if it doesn't exist
      if (!preferences.unsubscribeToken) {
        preferences.generateUnsubscribeToken();
        await preferences.save();
      }

      return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe?token=${preferences.unsubscribeToken}&type=${emailType}`;

    } catch (error) {
      console.error('Error generating unsubscribe URL:', error);
      return null;
    }
  }

  // Get user's current email preferences
  async getUserPreferences(userId) {
    try {
      const preferences = await EmailPreferences.findByUserId(userId);

      if (!preferences) {
        return null;
      }

      return {
        transactionEmails: preferences.transactionEmails,
        promotionalEmails: preferences.promotionalEmails,
        newsletterEmails: preferences.newsletterEmails,
        securityEmails: preferences.securityEmails,
        accountEmails: preferences.accountEmails,
        systemEmails: preferences.systemEmails,
        referralEmails: preferences.referralEmails,
        summaryEmails: preferences.summaryEmails,
        emailFrequency: preferences.emailFrequency,
        isEmailVerified: preferences.isEmailVerified,
        bounceCount: preferences.bounceCount,
        complaintCount: preferences.complaintCount
      };

    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  // Update user email preferences
  async updateUserPreferences(userId, updates) {
    try {
      let preferences = await EmailPreferences.findByUserId(userId);

      if (!preferences) {
        preferences = await EmailPreferences.createDefaultPreferences(userId);
      }

      // Update allowed fields
      const allowedFields = [
        'transactionEmails',
        'promotionalEmails',
        'newsletterEmails',
        'securityEmails',
        'accountEmails',
        'systemEmails',
        'referralEmails',
        'summaryEmails',
        'emailFrequency'
      ];

      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          preferences[field] = updates[field];
        }
      });

      await preferences.save();

      // Log the preference update
      await createLog('info', 'User updated email preferences', 'system', userId, null, {
        updates: Object.keys(updates)
      });

      return {
        success: true,
        preferences: await this.getUserPreferences(userId)
      };

    } catch (error) {
      console.error('Error updating user preferences:', error);
      return {
        success: false,
        error: 'Failed to update email preferences'
      };
    }
  }

  // Send confirmation email after unsubscribe
  async sendUnsubscribeConfirmation(email, emailType) {
    try {
      const subject = 'Unsubscribe Confirmation - OhTopUp';
      const html = emailLayout(`
        <h1 style="margin:0 0 18px;font-size:22px;font-weight:600;color:#18232d;">Email preferences updated</h1>
        <p style="margin:0 0 16px;color:#626d79;">You’ve unsubscribed from ${escapeHtml(emailType === 'all' ? 'optional' : emailType)} emails from OhTopUp.</p>
        <p style="margin:0 0 16px;color:#626d79;">You’ll still receive important security notifications. You can change your preferences in your account settings.</p>
        <a href="${escapeHtml(process.env.FRONTEND_URL || 'http://localhost:5173')}/settings/notifications" style="display:inline-block;margin:8px 0;padding:12px 20px;background-color:#3057c5;color:#fff;border-radius:4px;text-decoration:none;">Update preferences</a>
      `);

      await emailService.sendEmail({
        to: email,
        subject,
        html,
        emailType: 'unsubscribe-confirmation'
      });

      return { success: true };

    } catch (error) {
      console.error('Error sending unsubscribe confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  // Bulk unsubscribe for multiple users
  async bulkUnsubscribe(userIds, emailType = 'all') {
    try {
      const results = [];

      for (const userId of userIds) {
        const result = await this.updateUserPreferences(userId, {
          [emailType === 'all' ? 'promotionalEmails' : `${emailType}Emails`]: false
        });
        results.push({ userId, success: result.success });
      }

      const successCount = results.filter(r => r.success).length;

      await createLog('info', `Bulk unsubscribe completed: ${successCount}/${userIds.length}`, 'system', null, null, {
        emailType,
        totalUsers: userIds.length,
        successCount
      });

      return {
        success: true,
        total: userIds.length,
        successful: successCount,
        failed: userIds.length - successCount
      };

    } catch (error) {
      console.error('Error in bulk unsubscribe:', error);
      return {
        success: false,
        error: 'Failed to process bulk unsubscribe'
      };
    }
  }

  // Get unsubscribe statistics
  async getUnsubscribeStats() {
    try {
      const stats = await EmailPreferences.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            unsubscribedAll: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$transactionEmails', false] },
                      { $eq: ['$promotionalEmails', false] },
                      { $eq: ['$newsletterEmails', false] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            unsubscribedPromotional: {
              $sum: {
                $cond: [
                  { $eq: ['$promotionalEmails', false] },
                  1,
                  0
                ]
              }
            },
            activeUsers: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$transactionEmails', true] },
                      { $eq: ['$promotionalEmails', true] },
                      { $eq: ['$newsletterEmails', true] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      return stats[0] || {
        totalUsers: 0,
        unsubscribedAll: 0,
        unsubscribedPromotional: 0,
        activeUsers: 0
      };

    } catch (error) {
      console.error('Error getting unsubscribe stats:', error);
      return { error: error.message };
    }
  }
}

module.exports = new EmailUnsubscribeService();