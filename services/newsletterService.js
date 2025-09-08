const nodemailer = require('nodemailer');
const Newsletter = require('../model/Newsletter');

class NewsletterService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Use TLS instead of SSL for better compatibility
      secure: false,
      tls: {
        ciphers: 'SSLv3'
      }
    });
  }

  async sendNewsletter(subject, content, subscriberEmails = null) {
    try {
      let recipients = subscriberEmails;

      // If no specific emails provided, get all active subscribers
      if (!recipients) {
        const subscribers = await Newsletter.find({ isActive: true }).select('email');
        recipients = subscribers.map(sub => sub.email);
      }

      if (recipients.length === 0) {
        throw new Error('No active subscribers found');
      }

      // Send newsletter to all recipients
      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'OhTopUp'}" <${process.env.EMAIL_USER}>`,
        bcc: recipients, // Use BCC to protect subscriber privacy
        subject: subject,
        html: this.formatNewsletterHTML(content),
        text: this.stripHtmlTags(content), // Plain text fallback
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        message: `Newsletter sent to ${recipients.length} subscribers`,
        subscriberCount: recipients.length,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Newsletter sending error:', error);
      throw new Error('Failed to send newsletter: ' + error.message);
    }
  }

  formatNewsletterHTML(content) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OhTopUp Newsletter</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none; font-size: 12px; color: #666; }
            .unsubscribe { margin-top: 15px; }
            .unsubscribe a { color: #667eea; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>OhTopUp Newsletter</h1>
              <p>Your trusted utility payment partner</p>
            </div>
            <div class="content">
              ${content.replace(/\n/g, '<br>')}
            </div>
            <div class="footer">
              <p>You're receiving this because you subscribed to OhTopUp newsletters.</p>
              <div class="unsubscribe">
                <a href="${process.env.FRONTEND_URL}/unsubscribe">Unsubscribe from future newsletters</a>
              </div>
              <p>&copy; ${new Date().getFullYear()} OhTopUp. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  stripHtmlTags(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\n+/g, '\n').trim();
  }

  async getNewsletterStats() {
    try {
      const totalSubscribers = await Newsletter.countDocuments();
      const activeSubscribers = await Newsletter.countDocuments({ isActive: true });
      const inactiveSubscribers = totalSubscribers - activeSubscribers;

      // Get subscribers from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newSubscribers = await Newsletter.countDocuments({
        subscribedAt: { $gte: thirtyDaysAgo }
      });

      return {
        totalSubscribers,
        activeSubscribers,
        inactiveSubscribers,
        newSubscribers,
      };
    } catch (error) {
      console.error('Error getting newsletter stats:', error);
      throw error;
    }
  }

  async getRecentActivity(limit = 5) {
    try {
      const recentSubscribers = await Newsletter.find({ isActive: true })
        .sort({ subscribedAt: -1 })
        .limit(limit)
        .select('email subscribedAt');

      return recentSubscribers.map(sub => ({
        email: sub.email,
        subscribedAt: sub.subscribedAt,
        type: 'subscription'
      }));
    } catch (error) {
      console.error('Error getting recent activity:', error);
      throw error;
    }
  }
}

module.exports = new NewsletterService();