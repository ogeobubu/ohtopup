const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Keep the sendMail interface shared by account, transactional and newsletter mail.
function createTransport(smtpOptions) {
  if (process.env.EMAIL_PROVIDER !== 'resend') {
    return nodemailer.createTransport(smtpOptions || {
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }

  function verify() {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is required');
    if (!process.env.RESEND_FROM_EMAIL) {
      throw new Error('RESEND_FROM_EMAIL is required');
    }
    return true; // Configuration check only; does not send a health-check email.
  }

  return {
    verify,
    async sendMail(options) {
      verify();
      if (options.sandboxMode || options.mailSettings?.sandboxMode?.enable) {
        throw new Error('Resend does not support sandboxMode');
      }
      const sender = process.env.RESEND_FROM_EMAIL;
      const payload = {
        from: `${process.env.FROM_NAME || 'OhTopUp'} <${sender}>`,
        subject: options.subject,
        html: options.html,
        text: options.text,
        headers: options.headers,
      };
      for (const field of ['to', 'cc', 'bcc']) {
        if (options[field]) payload[field] = Array.isArray(options[field]) ? options[field] : [options[field]];
      }
      // Resend requires a To address, including for BCC-only newsletters.
      if (!payload.to) payload.to = [sender];
      if (options.replyTo) payload.reply_to = options.replyTo;
      try {
        const { data } = await axios.post('https://api.resend.com/emails', payload, {
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          timeout: 30000,
        });
        if (!data?.id) throw new Error('Resend returned no email ID');
        return { messageId: data.id };
      } catch (error) {
        // Never expose Axios config: it contains the Authorization header.
        const status = error.response?.status;
        throw new Error(status ? `Resend email request failed (HTTP ${status})` : 'Resend email request failed');
      }
    },
  };
}

module.exports = { createTransport };
