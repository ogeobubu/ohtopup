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

module.exports = {
  sendWaitlistEmail,
  sendLoginNotificationEmail
};
