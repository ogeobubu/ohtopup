const nodemailer = require("nodemailer");

const sendForgotPasswordEmail = async (user, fullName) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    to: user.email,
    from: process.env.EMAIL_USER,
    subject: "Password Reset for Your OhTopUp Account",
    html: `
        <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <img src="https://i.ibb.co/cvZqP33/ohtopup-high-resolution-logo-transparent.png" alt="OhTopUp Inc" style="width: 100px; display: block; margin-bottom: 20px;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">Password Reset for Your Account</h2>
          <p style="font-size: 16px; line-height: 1.5;">Hello ${fullName},</p>
          <p style="font-size: 16px; line-height: 1.5;">You're almost done. Kindly use the code below to complete your Password Reset.</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <p style="font-size: 24px; font-weight: bold; text-align: center;">${user.otp}</p>
          </div>
          <p style="font-size: 14px; color: #888; margin-bottom: 20px;">This code expires in 10 minutes. If you didn't initiate this action, you can ignore this email.</p>
          <a href="http://localhost:5173/reset-password" style="background-color: #007bff; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Reset Password</a>
        </div>
      `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendForgotPasswordEmail,
};
