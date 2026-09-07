const { emailLayout } = require('./email/layout');
const { createTransport } = require('./emailTransport');
const sgMail = require('@sendgrid/mail');
const { createLog } = require('../controllers/systemLogController');
const fs = require('fs').promises;
const path = require('path');
require("dotenv").config();

class EmailService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'gmail'; // 'gmail', 'sendgrid', or 'resend'
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

      case 'resend':
        this.transporter = createTransport();
        break;

      case 'gmail':
      default:
        this.transporter = createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
            // Add connection timeout and retry settings
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateDelta: 1000,
            rateLimit: 5,
            // Add timeout settings
            connectionTimeout: 60000, // 60 seconds
            greetingTimeout: 30000,   // 30 seconds
            socketTimeout: 60000,     // 60 seconds
          });
        break;
    }
  }

  loadTemplates() {
    // Email templates
    this.templates.set('transaction', {
      subject: '{{type}} {{status}}: {{productName}}',
      html: emailLayout(`
        <div>
          <div>
            <div>
              <h1 style="margin:0 0 18px;font-size:22px;line-height:1.35;font-weight:600;color:#18232d;">Transaction Update</h1>
            </div>
          </div>
          <div>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">Hello <strong>{{username}}</strong>,</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">Your recent transaction is <strong style="color:#18232d;font-weight:600;">{{status}}</strong>.</p>

            <div>
              <div style="display:table;width:100%;margin:20px 0;">
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Type:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">{{type}}</div>
                </div>
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Description:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">{{productName}}</div>
                </div>
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Amount:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">{{amount}}</div>
                </div>
                {{#processingFee}}
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Processing Fee:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">-{{processingFee}}</div>
                </div>
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Credited Amount:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">{{amount}}</div>
                </div>
                {{/processingFee}}
                {{#balance}}
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">New Balance:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">{{balance}}</div>
                </div>
                {{/balance}}
                {{#reference}}
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Reference:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">{{reference}}</div>
                </div>
                {{/reference}}
              </div>
            </div>

            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">If you have any questions, please contact our support team.</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">Thank you for using OhTopUp!</p>
          </div>

        </div>
      `, { unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe` })
    });

    this.templates.set('welcome', {
      subject: 'Welcome to OhTopUp, {{username}}!',
      html: emailLayout(`
        <div>
          <div>
            <h1 style="margin:0 0 18px;font-size:22px;line-height:1.35;font-weight:600;color:#18232d;">Welcome to OhTopUp!</h1>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">Your trusted utility payment partner</p>
          </div>
          <div>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">Hello <strong>{{username}}</strong>,</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">Thank you for creating an account with OhTopUp! We're excited to have you on board.</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">Your confirmation code is:</p>
            <div>
              <span style="display:block;margin:20px 0;padding:18px;background-color:#f7f8fa;border:1px solid #e2e6e9;text-align:center;font-size:30px;font-weight:600;letter-spacing:5px;color:#18232d;">{{confirmationCode}}</span>
            </div>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">This code expires in 10 minutes. If you didn't create this account, you can ignore this email.</p>
            <div>
              <a href="{{verifyUrl}}" style="display:inline-block;margin:8px 0 24px;padding:12px 20px;background-color:#3057c5;color:#ffffff;border-radius:4px;font-size:14px;text-decoration:none;">Verify Email</a>
            </div>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">Welcome aboard! 🚀</p>
          </div>

        </div>
      `, { unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe` })
    });

    this.templates.set('password-reset', {
      subject: 'Reset Your OhTopUp Password',
      html: emailLayout(`
        <div>
          <div>
            <h1 style="margin:0 0 18px;font-size:22px;line-height:1.35;font-weight:600;color:#18232d;">Password Reset</h1>
          </div>
          <div>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">Hello <strong>{{fullName}}</strong>,</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">We received a request to reset your password. Use the code below to complete your password reset:</p>
            <div>
              <span style="display:block;margin:20px 0;padding:18px;background-color:#f7f8fa;border:1px solid #e2e6e9;text-align:center;font-size:30px;font-weight:600;letter-spacing:5px;color:#18232d;">{{otp}}</span>
            </div>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">This code expires in 10 minutes. If you didn't request a password reset, you can ignore this email.</p>
            <div>
              <a href="{{resetUrl}}" style="display:inline-block;margin:8px 0 24px;padding:12px 20px;background-color:#3057c5;color:#ffffff;border-radius:4px;font-size:14px;text-decoration:none;">Reset Password</a>
            </div>
          </div>

        </div>
      `, { unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe` })
    });

    this.templates.set('email-verification', {
      subject: 'Verify Your OhTopUp Email Address',
      html: emailLayout(`
        <div>
          <div>
            <h1 style="margin:0 0 18px;font-size:22px;line-height:1.35;font-weight:600;color:#18232d;">Verify Your Email</h1>
          </div>
          <div>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">Hello <strong>{{userName}}</strong>,</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">Welcome to OhTopUp! Please verify your email address to complete your registration and start using our services.</p>

            <div>
              <a href="{{verificationUrl}}" style="display:inline-block;margin:8px 0 24px;padding:12px 20px;background-color:#3057c5;color:#ffffff;border-radius:4px;font-size:14px;text-decoration:none;">Verify Email Address</a>
            </div>

            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">
              This link will expire in 24 hours for security reasons.
            </p>

            <div>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">
                <strong>Didn't create an account?</strong> You can safely ignore this email.
              </p>
            </div>
          </div>

        </div>
      `, { unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe` })
    });

    this.templates.set('dice-win-admin', {
      subject: '🎲 Dice Game Win Alert - {{userName}} Won {{winAmount}} Points',
      html: emailLayout(`
        <div>
          <div>
            <h1 style="margin:0 0 18px;font-size:22px;line-height:1.35;font-weight:600;color:#18232d;">🎲 Dice Game Win Alert</h1>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">A user has won the dice game!</p>
          </div>
          <div>
            <div>
              <h3 style="margin:22px 0 10px;font-size:15px;line-height:1.5;font-weight:600;color:#18232d;">🎉 Win Details</h3>
              <div style="display:table;width:100%;margin:20px 0;">
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Player:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">{{userName}} ({{userEmail}})</div>
                </div>
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Dice Roll:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">{{dice1}} + {{dice2}} = {{total}}</div>
                </div>
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Win Amount:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">{{winAmount}} Points</div>
                </div>
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Entry Fee:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">₦{{entryFee}}</div>
                </div>
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Game Time:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">{{gameTime}}</div>
                </div>
                {{#manipulationApplied}}
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Manipulation:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">{{manipulationType}} ({{manipulationMode}})</div>
                </div>
                {{/manipulationApplied}}
              </div>
            </div>

            <div>
              <h4 style="margin:22px 0 10px;font-size:15px;line-height:1.5;font-weight:600;color:#18232d;">💰 Revenue Impact</h4>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">
                <strong>House Loss:</strong> ₦{{entryFee}} (entry fee paid but points awarded)<br>
                <strong>Points Awarded:</strong> {{winAmount}} points to user account
              </p>
            </div>

            {{#manipulationApplied}}
            <div>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">
                <strong>⚠️ Manipulation Alert:</strong> This win was generated using {{manipulationType}} mode ({{manipulationMode}}).
                {{#seed}}Seed: {{seed}}{{/seed}}
              </p>
            </div>
            {{/manipulationApplied}}

            <div>
              <a href="{{adminDashboardUrl}}" style="display:inline-block;margin:8px 0 24px;padding:12px 20px;background-color:#3057c5;color:#ffffff;border-radius:4px;font-size:14px;text-decoration:none;">View Admin Dashboard</a>
            </div>

            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">
              This is an automated notification for dice game wins. No action is required unless suspicious activity is detected.
            </p>
          </div>

        </div>
      `)
    });

    this.templates.set('bet-dice-win-admin', {
      subject: '🎯 Bet Dice Game Win Alert - {{userName}} Won ₦{{winnings}}',
      html: emailLayout(`
        <div>
          <div>
            <h1 style="margin:0 0 18px;font-size:22px;line-height:1.35;font-weight:600;color:#18232d;">🎯 Bet Dice Game Win Alert</h1>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">A user has won the bet dice game!</p>
          </div>
          <div>
            <div>
              <h3 style="margin:22px 0 10px;font-size:15px;line-height:1.5;font-weight:600;color:#18232d;">🎉 Win Details</h3>
              <div style="display:table;width:100%;margin:20px 0;">
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Player:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">{{userName}} ({{userEmail}})</div>
                </div>
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Bet Amount:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">₦{{betAmount}}</div>
                </div>
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Odds:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">{{odds}}x</div>
                </div>
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Difficulty:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">{{difficulty}}</div>
                </div>
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Dice Count:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">{{diceCount}}</div>
                </div>
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Dice Roll:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">{{dice}}</div>
                </div>
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Win Amount:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">₦{{winnings}}</div>
                </div>
                <div style="display:table-row;">
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">Game Time:</div>
                  <div style="display:table-cell;padding:8px 8px 8px 0;border-bottom:1px solid #e2e6e9;color:#18232d;">{{gameTime}}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 style="margin:22px 0 10px;font-size:15px;line-height:1.5;font-weight:600;color:#18232d;">💰 Revenue Impact</h4>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">
                <strong>House Loss:</strong> ₦{{betAmount}} (bet amount paid but winnings awarded)<br>
                <strong>Net Loss:</strong> ₦{{netLoss}} to house<br>
                <strong>Expected Value:</strong> ₦{{expectedValue}} ({{houseEdge}}% house edge)
              </p>
            </div>

            <div>
              <a href="{{adminDashboardUrl}}" style="display:inline-block;margin:8px 0 24px;padding:12px 20px;background-color:#3057c5;color:#ffffff;border-radius:4px;font-size:14px;text-decoration:none;">View Admin Dashboard</a>
            </div>

            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">
              This is an automated notification for bet dice game wins. Large wins are monitored for responsible gaming.
            </p>
          </div>

        </div>
      `)
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

        // Permission and validation failures need a configuration fix, not retries.
        if (attempt === retries || error.retryable === false) {
          console.log(error.retryable === false
            ? 'Email rejected; skipping retries and storing to file for later delivery.'
            : '🔄 All email attempts failed, storing to file as fallback...');
          try {
            const storeResult = await this.storeEmailToFile(emailData);
            return {
              success: false,
              stored: true,
              message: 'Email stored for later delivery',
              error: error.message,
              retryable: error.retryable !== false,
              filename: storeResult.filename
            };
          } catch (storeError) {
            console.error('Failed to store email to file:', storeError);
            throw new Error(`Failed to send email after ${retries} attempts and storage failed: ${error.message}`);
          }
        }

        // Wait before retry (optimized backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff: 1s, 2s, 4s, 8s, 10s max
        console.log(`⏳ Waiting ${delay}ms before retry attempt ${attempt + 1}`);
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
    }, 2000).unref(); // Process every 2 seconds
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
    }, 30000).unref(); // Check every 30 seconds
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
      reference: transactionDetails.reference,
      processingFee: transactionDetails.processingFee,
      originalAmount: transactionDetails.originalAmount
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
      resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset`
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
        return { healthy: true, provider: this.provider, ...(this.provider === 'resend' ? { configurationOnly: true } : {}) };
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
