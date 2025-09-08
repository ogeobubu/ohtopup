const nodemailer = require("nodemailer");

const sendVerificationEmail = async (username, email, confirmationCode) => {
  const transporter = nodemailer.createTransport({
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
    html: `
        <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <img src="https://i.ibb.co/4RTfSVRT/logo-remove.png" alt="OhTopUp Inc" style="width: 100px; display: block; margin-bottom: 20px;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">Welcome to OhTopUp, ${username}!</h2>
          <p style="font-size: 16px; line-height: 1.5;">Thank you for creating an account. Please verify your email address to activate your account and start using our services.</p>
          <p style="font-size: 16px; line-height: 1.5;">We noticed that you requested a new verification code. Here it is:</p>
          <p style="font-size: 16px; line-height: 1.5;">Your verification code is:</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <p style="font-size: 24px; font-weight: bold; text-align: center;">${confirmationCode}</p>
          </div>
          <p style="font-size: 14px; color: #888; margin-bottom: 20px;">This code expires in 10 minutes. If you didn't initiate this action, you can ignore this email.</p>
          <a href="https://ohtopup.onrender.com/verify" style="background-color: #007bff; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Veriy Email</a>
        </div>
      `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
    sendVerificationEmail,
};
