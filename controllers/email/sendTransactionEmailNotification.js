const nodemailer = require("nodemailer");

const sendTransactionEmailNotification = async (email, username, transactionDetails) => {
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
    subject: `Transaction Update: ${transactionDetails.product_name}`,
    html: `
      <div style="font-family: 'Open Sans', sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
      <img src="https://i.ibb.co/tCjf8sv/ohtopup-high-resolution-logo-transparent.png" alt="OhTopUp Inc" style="width: 100px; display: block; margin-bottom: 20px;">  
      <h2 style="font-size: 20px; font-weight: bold;">Transaction Update for ${username}</h2>
        <p style="font-size: 16px; line-height: 1.5;">Your transaction for <strong>${transactionDetails.product_name}</strong> is <strong>${transactionDetails.status}</strong>.</p>
        <p style="font-size: 16px; line-height: 1.5;">Amount: ${transactionDetails.amount}</p>
        <p style="font-size: 14px; color: #888;">If you have any questions, please contact our support team.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Transaction notification email sent successfully!");
  } catch (error) {
    console.error("Error sending transaction email:", error);
  }
};

module.exports = {
    sendTransactionEmailNotification,
  };