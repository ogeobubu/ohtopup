const { emailLayout } = require('../../services/email/layout');
const { createTransport } = require('../../services/emailTransport');

const sendWaitlistEmail = async (
  email,
  subject = "Welcome to the Waitlist!",
  message = "Thank you for joining our waitlist!"
) => {
  const transporter = createTransport();

  const mailOptions = {
    to: email,
    from: process.env.EMAIL_USER,
    subject,
    html: emailLayout(`
        <div>

          <h2 style="margin:0 0 18px;font-size:22px;line-height:1.35;font-weight:600;color:#18232d;">OhTopUp Waitlist!</h2>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">${message}</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">We will notify you when we launch!</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#626d79;">If you have any questions, feel free to reach out to us.</p>
        </div>
      `),
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendWaitlistEmail,
};
