const { emailLayout } = require('../../services/email/layout');
const { createTransport } = require('../../services/emailTransport');

const sendResendResetOTPEmail = async (username, email, otpCode) => {
  const transporter = createTransport({
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
        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">This code is valid for 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        <a href="https://ohtopup.name.ng/reset-password" style="display:inline-block;margin:8px 0 24px;padding:12px 20px;background-color:#3057c5;color:#ffffff;border-radius:4px;font-size:14px;text-decoration:none;">Reset Password</a>
      </div>
    `),
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendResendResetOTPEmail,
};
