const { emailLayout } = require('./email/layout');
const { createTransport } = require('./emailTransport');
const Newsletter = require('../model/Newsletter');

class NewsletterService {
  constructor() {
    this.transporter = createTransport({
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
    return emailLayout(`
      <h1 style="margin:0 0 18px;font-size:22px;font-weight:600;color:#18232d;">OhTopUp newsletter</h1>
      <div style="font-size:14px;line-height:1.7;color:#626d79;">${content.replace(/\n/g, '<br>')}</div>
    `, {
      unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe`,
      footerNote: 'You’re receiving this because you subscribed to OhTopUp newsletters.',
    });
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