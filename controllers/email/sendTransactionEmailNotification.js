const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendConfirmationEmail = async (email, username, confirmationCode) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    to: email,
    from: process.env.EMAIL_USER,
    subject: "Confirm Your OhTopUp Account",
    html: `
        <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <img src="https://i.ibb.co/tCjf8sv/ohtopup-high-resolution-logo-transparent.png" alt="OhTopUp Inc" style="width: 100px; display: block; margin-bottom: 20px;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">Welcome to OhTopUp, ${username}!</h2>
          <p style="font-size: 16px; line-height: 1.5;">Thank you for creating an account. Please verify your email address to activate your account and start using our services.</p>
          <p style="font-size: 16px; line-height: 1.5;">Your confirmation code is:</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <p style="font-size: 24px; font-weight: bold; text-align: center;">${confirmationCode}</p>
          </div>
          <p style="font-size: 14px; color: #888; margin-bottom: 20px;">This code expires in 10 minutes. If you didn't initiate this action, you can ignore this email.</p>
          <a href="http://localhost:5173/verify" style="background-color: #007bff; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Verify Email</a>
        </div>
      `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const sendForgotPasswordEmail = async (email, user, fullName) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    secure: true,
  });

  const mailOptions = {
    to: email,
    from: process.env.EMAIL_USER,
    subject: "Reset Your OhTopUp Password",
    html: `
        <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <img src="https://i.ibb.co/tCjf8sv/ohtopup-high-resolution-logo-transparent.png" alt="OhTopUp Inc" style="width: 100px; display: block; margin-bottom: 20px;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">Hi ${fullName},</h2>
          <p style="font-size: 16px; line-height: 1.5;">We received a request to reset your password. Use the code below to complete your password reset:</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <p style="font-size: 24px; font-weight: bold; text-align: center;">${user.otp}</p>
          </div>
          <p style="font-size: 14px; color: #888; margin-bottom: 20px;">This code expires in 10 minutes. If you didn't request a password reset, you can ignore this email.</p>
          <a href="http://localhost:5173/reset-password" style="background-color: #007bff; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Reset Password</a>
        </div>
      `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully!");
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};

const sendResendResetOTPEmail = async (username, email, otpCode) => {
  const transporter = nodemailer.createTransport({
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
    html: `
      <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
        <img src="https://i.ibb.co/tCjf8sv/ohtopup-high-resolution-logo-transparent.png" alt="OhTopUp Inc" style="width: 100px; display: block; margin-bottom: 20px;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">Hello, ${username}!</h2>
        <p style="font-size: 16px; line-height: 1.5;">We received a request to reset your password. To proceed, please use the One-Time Password (OTP) provided below:</p>
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="font-size: 24px; font-weight: bold; text-align: center;">${otpCode}</p>
        </div>
        <p style="font-size: 14px; color: #888; margin-bottom: 20px;">This code is valid for 10 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        <a href="http://localhost:5173/reset-password" style="background-color: #007bff; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Reset Password</a>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendVerificationEmail = async (username, email, confirmationCode) => {
  const transporter = nodemailer.createTransport({
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
    html: `
        <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <img src="https://i.ibb.co/tCjf8sv/ohtopup-high-resolution-logo-transparent.png" alt="OhTopUp Inc" style="width: 100px; display: block; margin-bottom: 20px;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">Welcome to OhTopUp, ${username}!</h2>
          <p style="font-size: 16px; line-height: 1.5;">Thank you for creating an account. Please verify your email address to activate your account and start using our services.</p>
          <p style="font-size: 16px; line-height: 1.5;">We noticed that you requested a new verification code. Here it is:</p>
          <p style="font-size: 16px; line-height: 1.5;">Your verification code is:</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <p style="font-size: 24px; font-weight: bold; text-align: center;">${confirmationCode}</p>
          </div>
          <p style="font-size: 14px; color: #888; margin-bottom: 20px;">This code expires in 10 minutes. If you didn't initiate this action, you can ignore this email.</p>
          <a href="http://localhost:5173/verify" style="background-color: #007bff; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Veriy Email</a>
        </div>
      `,
  };

  await transporter.sendMail(mailOptions);
};

const sendTransactionEmailNotification = async (
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

  const transporter = nodemailer.createTransport({
    service: "gmail", // Using Gmail service
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    to: email,
    from: process.env.EMAIL_USER, // Sender address
    // Subject can be dynamic based on type or status
    subject: `${transactionType} ${transactionStatus}: ${subjectProductName}`,
    html: `
      <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; padding-bottom: 20px;">
           <img src="https://i.ibb.co/tCjf8sv/ohtopup-high-resolution-logo-transparent.png" alt="OhTopUp Inc" style="width: 100px; height: auto; display: block; margin: 0 auto 15px;">
           <h1 style="color: #333; font-size: 24px; font-weight: bold;">Transaction Update</h1>
        </div>
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px;">
          <p style="font-size: 16px; line-height: 1.5; color: #555;">Hello ${username},</p>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">Your recent transaction is <strong>${transactionStatus}</strong>.</p>

          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #007bff; border-radius: 4px;">
              <p style="font-size: 16px; margin: 5px 0; color: #333;"><strong>Type:</strong> ${transactionType}</p>
              <p style="font-size: 16px; margin: 5px 0; color: #333;"><strong>Description:</strong> ${subjectProductName}</p>
              <p style="font-size: 16px; margin: 5px 0; color: #333;"><strong>Amount:</strong> ${transactionAmount}</p>
              ${
                transactionDetails.balance
                  ? `<p style="font-size: 16px; margin: 5px 0; color: #333;"><strong>New Balance:</strong> ${transactionDetails.balance}</p>`
                  : ""
              }
              ${
                transactionDetails.reference
                  ? `<p style="font-size: 16px; margin: 5px 0; color: #333;"><strong>Reference:</strong> ${transactionDetails.reference}</p>`
                  : ""
              }
          </div>


          <p style="font-size: 14px; color: #888; margin-top: 20px;">If you have any questions, please contact our support team.</p>
          <p style="font-size: 14px; color: #888; margin-top: 5px;">Thank you for using our service.</p>
        </div>
         <div style="text-align: center; margin-top: 20px; color: #aaa; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} OhTopUp Inc. All rights reserved.</p>
         </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Transaction notification email sent successfully!");
  } catch (error) {
    console.error("Error sending transaction email:", error);
    // Log specific Nodemailer errors if possible
    if (error.response) {
      console.error("Nodemailer SMTP response:", error.response);
    }
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

  const transporter = nodemailer.createTransport({
    service: "gmail", // Using Gmail service
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    to: email,
    from: process.env.EMAIL_USER, // Sender address
    // Subject can be dynamic based on type or status
    subject: `${transactionType} ${transactionStatus}: ${subjectProductName}`,
    html: `
      <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; padding-bottom: 20px;">
           <img src="https://i.ibb.co/tCjf8sv/ohtopup-high-resolution-logo-transparent.png" alt="OhTopUp Inc" style="width: 100px; height: auto; display: block; margin: 0 auto 15px;">
           <h1 style="color: #333; font-size: 24px; font-weight: bold;">Transaction Update</h1>
        </div>
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px;">
          <p style="font-size: 16px; line-height: 1.5; color: #555;">Hello ${username},</p>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">The recent transaction is <strong>${transactionStatus}</strong>.</p>

          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #007bff; border-radius: 4px;">
              <p style="font-size: 16px; margin: 5px 0; color: #333;"><strong>Type:</strong> ${transactionType}</p>
              <p style="font-size: 16px; margin: 5px 0; color: #333;"><strong>Description:</strong> ${subjectProductName}</p>
              <p style="font-size: 16px; margin: 5px 0; color: #333;"><strong>Amount:</strong> ${transactionAmount}</p>
              ${
                transactionDetails.balance
                  ? `<p style="font-size: 16px; margin: 5px 0; color: #333;"><strong>New Balance:</strong> ${transactionDetails.balance}</p>`
                  : ""
              }
              ${
                transactionDetails.reference
                  ? `<p style="font-size: 16px; margin: 5px 0; color: #333;"><strong>Reference:</strong> ${transactionDetails.reference}</p>`
                  : ""
              }
          </div>


          <p style="font-size: 14px; color: #888; margin-top: 20px;">If you have any questions, please contact our support team.</p>
          <p style="font-size: 14px; color: #888; margin-top: 5px;">Thank you for using our service.</p>
        </div>
         <div style="text-align: center; margin-top: 20px; color: #aaa; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} OhTopUp Inc. All rights reserved.</p>
         </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Transaction notification email sent successfully!");
  } catch (error) {
    console.error("Error sending transaction email:", error);
    // Log specific Nodemailer errors if possible
    if (error.response) {
      console.error("Nodemailer SMTP response:", error.response);
    }
  }
};

const sendLoginNotificationEmail = async (userEmail) => {
  const transporter = createTransporter();

  const mailOptions = {
    to: process.env.EMAIL_USER,
    from: userEmail,
    subject: "User Login Notification",
    html: `
      <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
        <img src="https://i.ibb.co/tCjf8sv/ohtopup-high-resolution-logo-transparent.png" alt="OhTopUp Inc" style="width: 100px; display: block; margin-bottom: 20px;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">User Login Notification</h2>
        <p style="font-size: 16px; line-height: 1.5;">A user has successfully logged in:</p>
        <p style="font-size: 16px; line-height: 1.5;"><strong>Email:</strong> ${userEmail}</p>
        <p style="font-size: 14px; color: #888; margin-bottom: 20px;">This is an automated message. Please do not reply.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendNotificationEmail = async (email, username, title, message, link) => {
  const transporter = createTransporter();

  const mailOptions = {
    to: email,
    from: process.env.EMAIL_USER,
    subject: `Notification: ${title}`,
    html: `
      <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      
        <div style="text-align: center; padding-bottom: 20px;">
           <img src="https://i.ibb.co/tCjf8sv/ohtopup-high-resolution-logo-transparent.png" alt="OhTopUp Inc" style="width: 100px; height: auto; display: block; margin: 0 auto 15px;">
           <h1 style="color: #333; font-size: 24px; font-weight: bold;">New Notification</h1>
        </div>
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px;">
          <p style="font-size: 16px; line-height: 1.5; color: #555;">Hello ${username},</p>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">You have received a new notification:</p>
          <h2 style="color: #007bff; font-size: 20px;">${title}</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">${message}</p>
          ${
            link
              ? `<p style="font-size: 16px; line-height: 1.5; color: #007bff;"><a href="${link}">View Details</a></p>`
              : ""
          }
          <p style="font-size: 14px; color: #888; margin-top: 20px;">If you have any questions, feel free to reach out to our support team.</p>
          <p style="font-size: 14px; color: #888; margin-top: 5px;">Thank you for being with us.</p>
        </div>
         <div style="text-align: center; margin-top: 20px; color: #aaa; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} OhTopUp Inc. All rights reserved.</p>
         </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendWaitlistEmail = async (
  email,
  subject = "Welcome to the Waitlist!",
  message = "Thank you for joining our waitlist!"
) => {
  const transporter = createTransporter();

  const mailOptions = {
    to: email,
    from: process.env.EMAIL_USER,
    subject,
    html: `
        <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <img src="https://i.ibb.co/tCjf8sv/ohtopup-high-resolution-logo-transparent.png" alt="OhTopUp Inc" style="width: 100px; display: block; margin-bottom: 20px;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">OhTopUp Waitlist!</h2>
          <p style="font-size: 16px; line-height: 1.5;">${message}</p>
          <p style="font-size: 16px; line-height: 1.5;">We will notify you when we launch!</p>
          <p style="font-size: 14px; color: #888; margin-bottom: 20px;">If you have any questions, feel free to reach out to us.</p>
        </div>
      `,
  };

  await transporter.sendMail(mailOptions);
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
