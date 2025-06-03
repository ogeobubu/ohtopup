const nodemailer = require("nodemailer");

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
        <img src="https://i.ibb.co/4RTfSVRT/logo-remove.png" alt="OhTopUp Inc" style="width: 100px; display: block; margin-bottom: 20px;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">Hello, ${username}!</h2>
        <p style="font-size: 16px; line-height: 1.5;">We received a request to reset your password. To proceed, please use the One-Time Password (OTP) provided below:</p>
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="font-size: 24px; font-weight: bold; text-align: center;">${otpCode}</p>
        </div>
        <p style="font-size: 14px; color: #888; margin-bottom: 20px;">This code is valid for 10 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        <a href="https://ohtopup.onrender.com/reset-password" style="background-color: #007bff; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Reset Password</a>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendResendResetOTPEmail,
};