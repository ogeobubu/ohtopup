const { emailLayout } = require('../../services/email/layout');
const { createTransport } = require('../../services/emailTransport');

const sendForgotPasswordEmail = async (email, user, fullName) => {
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
    subject: "Reset Your OhTopUp Password",
    html: emailLayout(`
        <div>

          <h2 style="margin:0 0 18px;font-size:22px;line-height:1.35;font-weight:600;color:#18232d;">Hi ${fullName},</h2>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">We received a request to reset your password. Use the code below to complete your password reset:</p>
          <div>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">${user.otp}</p>
          </div>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">This code expires in 10 minutes. If you didn't request a password reset, you can ignore this email.</p>
          <a href="http://localhost:5173/reset-password" style="display:inline-block;margin:8px 0 24px;padding:12px 20px;background-color:#3057c5;color:#ffffff;border-radius:4px;font-size:14px;text-decoration:none;">Reset Password</a>
        </div>
      `),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully!");
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};

module.exports = {
  sendForgotPasswordEmail,
};
