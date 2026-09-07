const { emailLayout } = require('../../services/email/layout');
const { createTransport } = require('../../services/emailTransport');

const sendVerificationEmail = async (username, email, confirmationCode) => {
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
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">This code expires in 1 hour. If you didn't initiate this action, you can ignore this email.</p>
          <a href="https://ohtopup.name.ng/verify" style="display:inline-block;margin:8px 0 24px;padding:12px 20px;background-color:#3057c5;color:#ffffff;border-radius:4px;font-size:14px;text-decoration:none;">Verify Email</a>
        </div>
      `),
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
    sendVerificationEmail,
};
