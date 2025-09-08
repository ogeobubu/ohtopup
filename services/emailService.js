const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const { createLog } = require('../controllers/systemLogController');
require("dotenv").config();

class EmailService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'gmail'; // 'gmail', 'sendgrid', 'mailgun', etc.
    this.templates = new Map();
    this.queue = [];
    this.isProcessing = false;

    this.initializeProvider();
    this.loadTemplates();
  }

  initializeProvider() {
    switch (this.provider) {
      case 'sendgrid':
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        this.transporter = null; // SendGrid uses its own SDK
        break;

      case 'gmail':
      default:
        this.transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587, // Use TLS port instead of SSL
          secure: false, // Use TLS
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false // For development/testing
          },
          // Connection pool for better performance
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          // Connection timeout
          connectionTimeout: 60000,
          greetingTimeout: 30000,
          socketTimeout: 60000
        });
        break;
    }
  }

  loadTemplates() {
    // Email templates
    this.templates.set('transaction', {
      subject: '{{type}} {{status}}: {{productName}}',
      html: `
        <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding-bottom: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Transaction Update</h1>
            </div>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; line-height: 1.5; color: #555;">Hello <strong>{{username}}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.5; color: #555;">Your recent transaction is <strong style="color: {{statusColor}};">{{status}}</strong>.</p>

            <div style="margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #007bff; border-radius: 4px;">
              <div style="display: table; width: 100%;">
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Type:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #555;">{{type}}</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Description:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #555;">{{productName}}</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Amount:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #555;">{{amount}}</div>
                </div>
                {{#balance}}
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">New Balance:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #555;">{{balance}}</div>
                </div>
                {{/balance}}
                {{#reference}}
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Reference:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #555;">{{reference}}</div>
                </div>
                {{/reference}}
              </div>
            </div>

            <p style="font-size: 14px; color: #888; margin-top: 20px;">If you have any questions, please contact our support team.</p>
            <p style="font-size: 14px; color: #888;">Thank you for using OhTopUp!</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #aaa; font-size: 12px;">
            <p>&copy; {{year}} OhTopUp. All rights reserved.</p>
            <p>OhTopUp | Lagos, Nigeria</p>
            <p><a href="{{unsubscribeUrl}}" style="color: #aaa;">Unsubscribe</a></p>
          </div>
        </div>
      `
    });

    this.templates.set('welcome', {
      subject: 'Welcome to OhTopUp, {{username}}!',
      html: `
        <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to OhTopUp!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Your trusted utility payment partner</p>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; line-height: 1.5; color: #555;">Hello <strong>{{username}}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.5; color: #555;">Thank you for creating an account with OhTopUp! We're excited to have you on board.</p>
            <p style="font-size: 16px; line-height: 1.5; color: #555;">Your confirmation code is:</p>
            <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 3px;">{{confirmationCode}}</span>
            </div>
            <p style="font-size: 14px; color: #888;">This code expires in 10 minutes. If you didn't create this account, you can ignore this email.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{verifyUrl}}" style="background-color: #007bff; color: #fff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Verify Email</a>
            </div>
            <p style="font-size: 14px; color: #888; margin-top: 20px;">Welcome aboard! 🚀</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #aaa; font-size: 12px;">
            <p>&copy; {{year}} OhTopUp. All rights reserved.</p>
            <p>OhTopUp | Lagos, Nigeria</p>
            <p><a href="{{unsubscribeUrl}}" style="color: #aaa;">Unsubscribe</a></p>
          </div>
        </div>
      `
    });

    this.templates.set('password-reset', {
      subject: 'Reset Your OhTopUp Password',
      html: `
        <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Password Reset</h1>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; line-height: 1.5; color: #555;">Hello <strong>{{fullName}}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.5; color: #555;">We received a request to reset your password. Use the code below to complete your password reset:</p>
            <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <span style="font-size: 32px; font-weight: bold; color: #dc3545; letter-spacing: 3px;">{{otp}}</span>
            </div>
            <p style="font-size: 14px; color: #888;">This code expires in 10 minutes. If you didn't request a password reset, you can ignore this email.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{resetUrl}}" style="background-color: #dc3545; color: #fff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #aaa; font-size: 12px;">
            <p>&copy; {{year}} OhTopUp. All rights reserved.</p>
            <p>OhTopUp | Lagos, Nigeria</p>
            <p><a href="{{unsubscribeUrl}}" style="color: #aaa;">Unsubscribe</a></p>
          </div>
        </div>
      `
    });

    this.templates.set('email-verification', {
      subject: 'Verify Your OhTopUp Email Address',
      html: `
        <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Verify Your Email</h1>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; line-height: 1.5; color: #555;">Hello <strong>{{userName}}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.5; color: #555;">Welcome to OhTopUp! Please verify your email address to complete your registration and start using our services.</p>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Why verify your email?</h3>
              <ul style="color: #555;">
                <li>Receive important transaction notifications</li>
                <li>Access your account securely</li>
                <li>Get updates about new features and offers</li>
                <li>Ensure delivery of critical communications</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{verificationUrl}}" style="background-color: #28a745; color: #fff; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px;">Verify Email Address</a>
            </div>

            <p style="font-size: 14px; color: #888; text-align: center;">
              This link will expire in 24 hours for security reasons.
            </p>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>Didn't create an account?</strong> You can safely ignore this email.
              </p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #aaa; font-size: 12px;">
            <p>&copy; {{year}} OhTopUp. All rights reserved.</p>
            <p>OhTopUp | Lagos, Nigeria</p>
          </div>
        </div>
      `
    });
  }

  // Render template with data
  renderTemplate(templateName, data) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    let subject = template.subject;
    let html = template.html;

    // Replace variables in subject and HTML
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, data[key] || '');
      html = html.replace(regex, data[key] || '');
    });

    // Handle conditional blocks
    html = html.replace(/{{#(\w+)}}([\s\S]*?){{\/\1}}/g, (match, condition, content) => {
      return data[condition] ? content : '';
    });

    return { subject, html };
  }

  // Send email with retry logic
  async sendEmail(options, retries = 3) {
    const emailData = {
      from: options.from || `"${process.env.FROM_NAME || 'OhTopUp'}" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      // Add headers for better deliverability
      headers: {
        'List-Unsubscribe': `<${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe>`,
        'X-Mailer': 'OhTopUp Email Service',
        ...options.headers
      },
      // Disable tracking for better deliverability (optional)
      trackingSettings: {
        clickTracking: { enable: false },
        openTracking: { enable: false },
        ...options.trackingSettings
      },
      // Add mail settings for better deliverability
      mailSettings: {
        sandboxMode: {
          enable: options.sandboxMode || false
        },
        ...options.mailSettings
      },
      ...options
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        let result;

        if (this.provider === 'sendgrid') {
          result = await sgMail.send(emailData);
        } else {
          result = await this.transporter.sendMail(emailData);
        }

        // Log successful email
        await createLog(
          'info',
          `Email sent successfully to ${options.to}`,
          'system',
          null,
          null,
          {
            emailType: options.emailType || 'general',
            messageId: result.messageId,
            provider: this.provider
          }
        );

        return { success: true, messageId: result.messageId };

      } catch (error) {
        console.error(`Email send attempt ${attempt} failed:`, error.message);

        // Log email failure
        const errorMessage = `Email send failed (attempt ${attempt}): ${error.message}`;
        await createLog(
          'error',
          errorMessage,
          'system',
          null,
          null,
          {
            emailType: options.emailType || 'general',
            recipient: options.to,
            provider: this.provider,
            errorCode: error.code,
            attempt
          }
        );

        // If this is the last attempt, throw the error
        if (attempt === retries) {
          throw new Error(`Failed to send email after ${retries} attempts: ${error.message}`);
        }

        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Send templated email
  async sendTemplate(templateName, recipient, data = {}) {
    try {
      const { subject, html } = this.renderTemplate(templateName, {
        year: new Date().getFullYear(),
        ...data
      });

      return await this.sendEmail({
        to: recipient,
        subject,
        html,
        emailType: templateName
      });
    } catch (error) {
      console.error(`Template email send failed:`, error.message);
      throw error;
    }
  }

  // Send transaction notification
  async sendTransactionNotification(email, username, transactionDetails) {
    const statusColor = transactionDetails.status === 'completed' ? '#28a745' :
                       transactionDetails.status === 'pending' ? '#ffc107' : '#dc3545';

    return this.sendTemplate('transaction', email, {
      username,
      status: transactionDetails.status,
      statusColor,
      type: transactionDetails.type || 'Transaction',
      productName: transactionDetails.product_name || 'Service',
      amount: transactionDetails.amount || 'N/A',
      balance: transactionDetails.balance,
      reference: transactionDetails.reference
    });
  }

  // Send welcome email
  async sendWelcomeEmail(email, username, confirmationCode) {
    return this.sendTemplate('welcome', email, {
      username,
      confirmationCode,
      verifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify`
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(email, fullName, otp) {
    return this.sendTemplate('password-reset', email, {
      fullName,
      otp,
      resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`
    });
  }

  // Send email verification
  async sendEmailVerification(email, userName, verificationToken) {
    return this.sendTemplate('email-verification', email, {
      userName,
      verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`
    });
  }

  // Send bulk emails (for newsletters)
  async sendBulkEmails(recipients, subject, content, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 10;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const promises = batch.map(recipient =>
        this.sendEmail({
          to: recipient,
          subject,
          html: content,
          emailType: 'bulk'
        }).catch(error => ({
          success: false,
          email: recipient,
          error: error.message
        }))
      );

      const batchResults = await Promise.allSettled(promises);
      results.push(...batchResults);

      // Small delay between batches to avoid rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // Health check
  async healthCheck() {
    try {
      if (this.provider === 'sendgrid') {
        // SendGrid health check
        const response = await sgMail.send({
          to: process.env.EMAIL_USER,
          from: process.env.EMAIL_USER,
          subject: 'Health Check',
          text: 'Email service health check',
          mailSettings: {
            sandboxMode: {
              enable: true
            }
          }
        });
        return { healthy: true, provider: 'sendgrid' };
      } else {
        // Gmail health check
        await this.transporter.verify();
        return { healthy: true, provider: 'gmail' };
      }
    } catch (error) {
      return {
        healthy: false,
        provider: this.provider,
        error: error.message
      };
    }
  }
}

module.exports = new EmailService();