const nodemailer = require("nodemailer");

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
          <img src="https://i.ibb.co/4RTfSVRT/logo-remove.png" alt="OhTopUp Inc" style="width: 100px; display: block; margin-bottom: 20px;">
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

module.exports = {
  sendForgotPasswordEmail,
};