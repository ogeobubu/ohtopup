const { emailLayout } = require('../../services/email/layout');
const { createTransport } = require('../../services/emailTransport');

require("dotenv").config();

const createTransporter = () => {
  return createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },

  });
};

const sendConfirmationEmail = async (email, username, confirmationCode) => {
  try {
    const result = await emailService.sendWelcomeEmail(email, username, confirmationCode);
    console.log("Confirmation email sent successfully!", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending confirmation email:", error.message);
    throw error;
  }
};

const sendForgotPasswordEmail = async (email, user, fullName) => {
  try {
    const result = await emailService.sendPasswordResetEmail(email, fullName, user.otp);
    console.log("Password reset email sent successfully!", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending password reset email:", error.message);
    throw error;
  }
};

const sendResendResetOTPEmail = async (username, email, otpCode) => {
  try {
    const transporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: "Your OTP Code for Password Reset - OhTopUp",
      html: emailLayout(`
        <div>

          <h2 style="margin:0 0 18px;font-size:22px;line-height:1.35;font-weight:600;color:#18232d;">Hello, ${username}!</h2>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">We received a request to reset your password. To proceed, please use the One-Time Password (OTP) provided below:</p>
          <div>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">${otpCode}</p>
          </div>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">This code is valid for 10 minutes. If you did not request a password reset, you can safely ignore this email.</p>
          <a href="http://localhost:5173/reset-password" style="display:inline-block;margin:8px 0 24px;padding:12px 20px;background-color:#3057c5;color:#ffffff;border-radius:4px;font-size:14px;text-decoration:none;">Reset Password</a>
        </div>
      `),
    };

    await transporter.sendMail(mailOptions);
    console.log("Resend OTP email sent successfully!");
  } catch (error) {
    console.error("Error sending resend OTP email:", error);
    throw error; // This one should throw since it's critical for password reset
  }
};

const sendVerificationEmail = async (username, email, confirmationCode) => {
  try {
    const transporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: "Verification Code - OhTopUp",
      html: emailLayout(`
          <div>

            <h2 style="margin:0 0 18px;font-size:22px;line-height:1.35;font-weight:600;color:#18232d;">Welcome to OhTopUp, ${username}!</h2>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">Thank you for creating an account. Please verify your email address to activate your account and start using our services.</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">We noticed that you requested a new verification code. Here it is:</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">Your verification code is:</p>
            <div>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">${confirmationCode}</p>
            </div>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">This code expires in 10 minutes. If you didn't initiate this action, you can ignore this email.</p>
            <a href="http://localhost:5173/verify" style="display:inline-block;margin:8px 0 24px;padding:12px 20px;background-color:#3057c5;color:#ffffff;border-radius:4px;font-size:14px;text-decoration:none;">Verify Email</a>
          </div>
        `),
    };

    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully!");
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error; // This should throw since verification is critical
  }
};

const emailService = require("../../services/emailService");

const sendTransactionEmailNotification = async (
  email,
  username,
  transactionDetails
) => {
  try {
    const result = await emailService.sendTransactionNotification(email, username, transactionDetails);
    console.log("Transaction notification email sent successfully!", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending transaction email:", error.message);
    throw error; // Re-throw to let caller handle it
  }
};

const sendTransactionEmailAdminNotification = async (
  email,
  username,
  transactionDetails
) => {
  // Ensure required details are present, provide defaults if necessary
  const subjectProductName =
    transactionDetails.product_name || "Wallet Credit/Debit";
  const transactionStatus = transactionDetails.status || "completed";
  const transactionAmount = transactionDetails.amount || "N/A";
  const transactionType = transactionDetails.type || "Transaction";

  try {
    const result = await emailService.sendEmail({
      to: email,
      subject: `${transactionType} ${transactionStatus}: ${subjectProductName}`,
      html: emailLayout(`
        <div>
          <div>

             <h1 style="margin:0 0 18px;font-size:22px;line-height:1.35;font-weight:600;color:#18232d;">Transaction Update</h1>
          </div>
          <div>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">Hello ${username},</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">The recent transaction is <strong>${transactionStatus}</strong>.</p>

            <div>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;"><strong>Type:</strong> ${transactionType}</p>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;"><strong>Description:</strong> ${subjectProductName}</p>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;"><strong>Amount:</strong> ${transactionAmount}</p>
                ${
                  transactionDetails.balance
                    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;"><strong>New Balance:</strong> ${transactionDetails.balance}</p>`
                    : ""
                }
                ${
                  transactionDetails.reference
                    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;"><strong>Reference:</strong> ${transactionDetails.reference}</p>`
                    : ""
                }
            </div>


            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">If you have any questions, please contact our support team.</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">Thank you for using our service.</p>
          </div>

        </div>
      `),
      emailType: 'admin_transaction_notification'
    });
    console.log("Admin transaction notification email sent successfully!", result.messageId);
  } catch (error) {
    console.error("Error sending admin transaction email:", error);
    // Log specific Nodemailer errors if possible
    if (error.response) {
      console.error("Nodemailer SMTP response:", error.response);
    }
  }
};

const sendLoginNotificationEmail = async (userEmail) => {
  try {
    const result = await emailService.sendEmail({
      to: process.env.EMAIL_USER,
      from: userEmail,
      subject: "User Login Notification",
      html: emailLayout(`
        <div>

          <h2 style="margin:0 0 18px;font-size:22px;line-height:1.35;font-weight:600;color:#18232d;">User Login Notification</h2>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">A user has successfully logged in:</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;"><strong>Email:</strong> ${userEmail}</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">This is an automated message. Please do not reply.</p>
        </div>
      `),
      emailType: 'login_notification'
    });
    console.log("Login notification email sent successfully!", result.messageId);
  } catch (error) {
    console.error("Error sending login notification email:", error);
    // Don't throw the error - we don't want login to fail because of email issues
  }
};

const sendNotificationEmail = async (email, username, title, message, link) => {
  const result = await emailService.sendEmail({
    to: email,
    subject: `Notification: ${title}`,
    html: emailLayout(`
      <div>

        <div>

           <h1 style="margin:0 0 18px;font-size:22px;line-height:1.35;font-weight:600;color:#18232d;">New Notification</h1>
        </div>
        <div>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">Hello ${username},</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">You have received a new notification:</p>
          <h2 style="margin:0 0 18px;font-size:22px;line-height:1.35;font-weight:600;color:#18232d;">${title}</h2>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">${message}</p>
          ${
            link
              ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;"><a href="${link}">View Details</a></p>`
              : ""
          }
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">If you have any questions, feel free to reach out to our support team.</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">Thank you for being with us.</p>
        </div>

      </div>
    `),
    emailType: 'notification'
  });
  console.log("Notification email sent successfully!", result.messageId);
};

const sendWaitlistEmail = async (
  email,
  subject = "Welcome to the Waitlist!",
  message = "Thank you for joining our waitlist!"
) => {
  const result = await emailService.sendEmail({
    to: email,
    subject,
    html: emailLayout(`
        <div>

          <h2 style="margin:0 0 18px;font-size:22px;line-height:1.35;font-weight:600;color:#18232d;">OhTopUp Waitlist!</h2>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">${message}</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">We will notify you when we launch!</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">If you have any questions, feel free to reach out to us.</p>
        </div>
      `),
    emailType: 'waitlist'
  });
  console.log("Waitlist email sent successfully!", result.messageId);
};

module.exports = {
  sendTransactionEmailNotification,
  sendForgotPasswordEmail,
  sendResendResetOTPEmail,
  sendConfirmationEmail,
  sendVerificationEmail,
  sendLoginNotificationEmail,
  sendTransactionEmailAdminNotification,
  sendNotificationEmail,
  sendWaitlistEmail
};
