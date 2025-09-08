const fs = require('fs');
const path = require('path');

// Files to update
const emailFiles = [
  'controllers/email/sendResendResetOTPEmail.js',
  'controllers/email/sendVerificationEmail.js',
  'services/newsletterService.js'
];

const oldConfig = `  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });`;

const newConfig = `  const transporter = nodemailer.createTransport({
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
  });`;

console.log('🔧 Fixing email configurations...');

emailFiles.forEach(filePath => {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    let content = fs.readFileSync(fullPath, 'utf8');

    if (content.includes(oldConfig)) {
      content = content.replace(oldConfig, newConfig);
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Updated ${filePath}`);
    } else {
      console.log(`⚠️  No changes needed for ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
});

console.log('🎉 Email configuration fixes completed!');