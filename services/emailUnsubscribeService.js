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
      const html = `
        <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Unsubscribe Confirmation</h1>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; line-height: 1.5; color: #555;">Hello,</p>
            <p style="font-size: 16px; line-height: 1.5; color: #555;">
              You have successfully unsubscribed from <strong>${emailType === 'all' ? 'all' : emailType}</strong> emails from OhTopUp.
            </p>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">What happens next?</h3>
              <ul style="color: #555;">
                <li>You will no longer receive ${emailType === 'all' ? 'any' : emailType} emails from us</li>
                <li>You can update your preferences anytime from your account settings</li>
                <li>You will still receive important security notifications</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/notifications"
                 style="background-color: #007bff; color: #fff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                Update Preferences
              </a>
            </div>

            <p style="font-size: 14px; color: #888; margin-top: 20px;">
              If you didn't request this unsubscribe, please contact our support team.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #aaa; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} OhTopUp. All rights reserved.</p>
          </div>
        </div>
      `;

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