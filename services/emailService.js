const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const { createLog } = require('../controllers/systemLogController');
const fs = require('fs').promises;
const path = require('path');
require("dotenv").config();

class EmailService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'gmail'; // 'gmail', 'sendgrid', 'mailgun', etc.
    this.templates = new Map();
    this.queue = [];
    this.isProcessing = false;
    this.retryQueue = []; // Queue for failed emails
    this.maxRetries = 5;
    this.retryDelay = 60000; // 1 minute
    this.fallbackMode = false; // Flag for fallback mode

    this.initializeProvider();
    this.loadTemplates();
    this.startQueueProcessor();
    this.startRetryProcessor();
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
           service: 'gmail',
           auth: {
             user: process.env.EMAIL_USER,
             pass: process.env.EMAIL_PASS,
           },
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

    this.templates.set('dice-win-admin', {
      subject: '🎲 Dice Game Win Alert - {{userName}} Won {{winAmount}} Points',
      html: `
        <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🎲 Dice Game Win Alert</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">A user has won the dice game!</p>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="margin-top: 0; color: #28a745;">🎉 Win Details</h3>
              <div style="display: table; width: 100%; margin-top: 15px;">
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Player:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #555;">{{userName}} ({{userEmail}})</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Dice Roll:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #555;">{{dice1}} + {{dice2}} = {{total}}</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Win Amount:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #28a745; font-weight: bold;">{{winAmount}} Points</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Entry Fee:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #dc3545;">₦{{entryFee}}</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Game Time:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #555;">{{gameTime}}</div>
                </div>
                {{#manipulationApplied}}
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Manipulation:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #856404; font-weight: bold;">{{manipulationType}} ({{manipulationMode}})</div>
                </div>
                {{/manipulationApplied}}
              </div>
            </div>

            <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #495057;">💰 Revenue Impact</h4>
              <p style="margin: 10px 0; color: #6c757d;">
                <strong>House Loss:</strong> ₦{{entryFee}} (entry fee paid but points awarded)<br>
                <strong>Points Awarded:</strong> {{winAmount}} points to user account
              </p>
            </div>

            {{#manipulationApplied}}
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>⚠️ Manipulation Alert:</strong> This win was generated using {{manipulationType}} mode ({{manipulationMode}}).
                {{#seed}}Seed: {{seed}}{{/seed}}
              </p>
            </div>
            {{/manipulationApplied}}

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{adminDashboardUrl}}" style="background-color: #007bff; color: #fff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">View Admin Dashboard</a>
            </div>

            <p style="font-size: 12px; color: #888; text-align: center; margin-top: 20px;">
              This is an automated notification for dice game wins. No action is required unless suspicious activity is detected.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #aaa; font-size: 12px;">
            <p>&copy; {{year}} OhTopUp. All rights reserved.</p>
            <p>OhTopUp Admin System | Lagos, Nigeria</p>
          </div>
        </div>
      `
    });

    this.templates.set('bet-dice-win-admin', {
      subject: '🎯 Bet Dice Game Win Alert - {{userName}} Won ₦{{winnings}}',
      html: `
        <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🎯 Bet Dice Game Win Alert</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">A user has won the bet dice game!</p>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #667eea;">🎉 Win Details</h3>
              <div style="display: table; width: 100%; margin-top: 15px;">
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Player:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #555;">{{userName}} ({{userEmail}})</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Bet Amount:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #555;">₦{{betAmount}}</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Odds:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #555;">{{odds}}x</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Difficulty:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #555;">{{difficulty}}</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Dice Count:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #555;">{{diceCount}}</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Dice Roll:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #555;">{{dice}}</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Win Amount:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #28a745; font-weight: bold;">₦{{winnings}}</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 5px 0; font-weight: bold; color: #333;">Game Time:</div>
                  <div style="display: table-cell; padding: 5px 0; color: #555;">{{gameTime}}</div>
                </div>
              </div>
            </div>

            <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #495057;">💰 Revenue Impact</h4>
              <p style="margin: 10px 0; color: #6c757d;">
                <strong>House Loss:</strong> ₦{{betAmount}} (bet amount paid but winnings awarded)<br>
                <strong>Net Loss:</strong> ₦{{netLoss}} to house<br>
                <strong>Expected Value:</strong> ₦{{expectedValue}} ({{houseEdge}}% house edge)
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{adminDashboardUrl}}" style="background-color: #667eea; color: #fff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">View Admin Dashboard</a>
            </div>

            <p style="font-size: 12px; color: #888; text-align: center; margin-top: 20px;">
              This is an automated notification for bet dice game wins. Large wins are monitored for responsible gaming.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #aaa; font-size: 12px;">
            <p>&copy; {{year}} OhTopUp. All rights reserved.</p>
            <p>OhTopUp Admin System | Lagos, Nigeria</p>
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

  // Store email to file when service is completely down
  async storeEmailToFile(emailData) {
    try {
      const emailDir = path.join(__dirname, '../email-queue');
      await fs.mkdir(emailDir, { recursive: true });

      const filename = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`;
      const filepath = path.join(emailDir, filename);

      const emailRecord = {
        ...emailData,
        storedAt: new Date().toISOString(),
        status: 'stored',
        filename
      };

      await fs.writeFile(filepath, JSON.stringify(emailRecord, null, 2));

      console.log(`💾 Email stored to file: ${filename} (${emailData.subject})`);
      console.log(`📂 Email storage location: ${emailDir}/${filename}`);
      return { success: true, stored: true, filename };
    } catch (error) {
      console.error('Failed to store email to file:', error);
      throw error;
    }
  }

  // Send email with retry logic and fallback storage
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

        // If this is the last attempt, try to store to file instead
        if (attempt === retries) {
          console.log('🔄 All email attempts failed, storing to file as fallback...');
          try {
            const storeResult = await this.storeEmailToFile(emailData);
            return {
              success: false,
              stored: true,
              message: 'Email stored for later delivery',
              filename: storeResult.filename
            };
          } catch (storeError) {
            console.error('Failed to store email to file:', storeError);
            throw new Error(`Failed to send email after ${retries} attempts and storage failed: ${error.message}`);
          }
        }

        // Wait before retry (optimized backoff)
        const delay = Math.min(500 * Math.pow(1.5, attempt - 1), 3000); // Faster, shorter delays
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Queue email for background processing
  async queueEmail(options) {
    const emailJob = {
      id: Date.now() + Math.random(),
      options,
      timestamp: new Date(),
      retries: 0,
      maxRetries: this.maxRetries
    };

    this.queue.push(emailJob);

    console.log(`📧 Email queued for background processing: ${options.subject} to ${options.to}`);

    // Log queuing
    await createLog(
      'info',
      `Email queued for background processing: ${options.subject}`,
      'system',
      null,
      null,
      {
        emailType: options.emailType || 'general',
        recipient: options.to,
        queueSize: this.queue.length
      }
    );

    return { success: true, queued: true, jobId: emailJob.id };
  }

  // Start background queue processor
  startQueueProcessor() {
    setInterval(async () => {
      if (this.isProcessing || this.queue.length === 0) return;

      this.isProcessing = true;

      try {
        const emailJob = this.queue.shift();
        if (!emailJob) return;

        console.log(`⚙️ Processing queued email: ${emailJob.options.subject} to ${emailJob.options.to}`);

        try {
          const result = await this.sendEmailDirect(emailJob.options);
          console.log(`✅ Queued email sent successfully: ${result.messageId}`);
        } catch (error) {
          console.error(`❌ Queued email failed:`, error.message);

          // Add to retry queue if retries available
          if (emailJob.retries < emailJob.maxRetries) {
            emailJob.retries++;
            this.retryQueue.push(emailJob);
            console.log(`Email added to retry queue (attempt ${emailJob.retries}/${emailJob.maxRetries})`);
          } else {
            console.error(`Email permanently failed after ${emailJob.maxRetries} attempts`);
          }
        }
      } catch (error) {
        console.error('Queue processing error:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 2000); // Process every 2 seconds
  }

  // Start retry processor
  startRetryProcessor() {
    setInterval(async () => {
      if (this.retryQueue.length === 0) return;

      const now = Date.now();
      const jobsToProcess = this.retryQueue.filter(job =>
        (now - job.timestamp.getTime()) >= this.retryDelay
      );

      for (const job of jobsToProcess) {
        // Remove from retry queue
        const index = this.retryQueue.indexOf(job);
        if (index > -1) this.retryQueue.splice(index, 1);

        // Add back to main queue
        this.queue.push(job);
        console.log(`🔄 Retrying email after delay: ${job.options.subject} (attempt ${job.retries + 1}/${job.maxRetries})`);
      }
    }, 30000); // Check every 30 seconds
  }

  // Direct email sending without retry logic (for queue processing)
  async sendEmailDirect(options) {
    const emailData = {
      from: options.from || `"${process.env.FROM_NAME || 'OhTopUp'}" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      headers: {
        'List-Unsubscribe': `<${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe>`,
        'X-Mailer': 'OhTopUp Email Service',
        ...options.headers
      },
      trackingSettings: {
        clickTracking: { enable: false },
        openTracking: { enable: false },
        ...options.trackingSettings
      },
      mailSettings: {
        sandboxMode: {
          enable: options.sandboxMode || false
        },
        ...options.mailSettings
      },
      ...options
    };

    try {
      let result;
      if (this.provider === 'sendgrid') {
        result = await sgMail.send(emailData);
      } else {
        result = await this.transporter.sendMail(emailData);
      }

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Direct email send failed, storing to file:', error.message);
      // Store to file as fallback
      const storeResult = await this.storeEmailToFile(emailData);
      return {
        success: false,
        stored: true,
        message: 'Email stored for later delivery',
        filename: storeResult.filename
      };
    }
  }

  // Send templated email
  async sendTemplate(templateName, recipient, data = {}) {
    try {
      const { subject, html } = this.renderTemplate(templateName, {
        year: new Date().getFullYear(),
        ...data
      });

      // Use queue for critical emails to prevent transaction failures
      if (templateName === 'transaction' || templateName === 'bet-dice-win-admin' || templateName === 'dice-win-admin') {
        return await this.queueEmail({
          to: recipient,
          subject,
          html,
          emailType: templateName
        });
      }

      // Try direct send for non-critical emails, fallback to queue if it fails
      try {
        return await this.sendEmail({
          to: recipient,
          subject,
          html,
          emailType: templateName
        });
      } catch (error) {
        console.warn(`Direct email send failed, queuing instead:`, error.message);
        return await this.queueEmail({
          to: recipient,
          subject,
          html,
          emailType: templateName
        });
      }
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

  // Send dice game win notification to admin
  async sendDiceWinAdminNotification(adminEmail, winDetails) {
    return this.sendTemplate('dice-win-admin', adminEmail, {
      userName: winDetails.userName,
      userEmail: winDetails.userEmail,
      dice1: winDetails.dice1,
      dice2: winDetails.dice2,
      total: winDetails.dice1 + winDetails.dice2,
      winAmount: winDetails.winAmount,
      entryFee: winDetails.entryFee,
      gameTime: new Date(winDetails.gameTime).toLocaleString(),
      manipulationApplied: winDetails.manipulationApplied,
      manipulationType: winDetails.manipulationType,
      manipulationMode: winDetails.manipulationMode,
      seed: winDetails.seed,
      adminDashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dice`
    });
  }

  // Send bet dice game win notification to admin
  async sendBetDiceWinAdminNotification(adminEmail, winDetails) {
    return this.sendTemplate('bet-dice-win-admin', adminEmail, {
      userName: winDetails.userName,
      userEmail: winDetails.userEmail,
      betAmount: winDetails.betAmount,
      odds: winDetails.odds,
      difficulty: winDetails.difficulty,
      diceCount: winDetails.diceCount,
      dice: winDetails.dice,
      winnings: winDetails.winnings,
      gameTime: new Date(winDetails.gameTime).toLocaleString(),
      expectedValue: winDetails.expectedValue,
      houseEdge: winDetails.houseEdge,
      netLoss: (winDetails.winnings - winDetails.betAmount).toLocaleString(),
      adminDashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/bet-dice`
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