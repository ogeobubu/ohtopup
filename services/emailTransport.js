const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();

function configurationError(message) {
  return Object.assign(new Error(message), { retryable: false });
}

function safeErrorDetail(value) {
  if (typeof value !== 'string') return '';
  let detail = value;
  if (process.env.RESEND_API_KEY) detail = detail.split(process.env.RESEND_API_KEY).join('[redacted]');
  return detail.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/re_[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/[\r\n\t]/g, ' ').slice(0, 500);
}

// Keep the sendMail interface shared by account, transactional and newsletter mail.
function createTransport(smtpOptions) {
  if (process.env.EMAIL_PROVIDER !== 'resend') {
    return nodemailer.createTransport(smtpOptions || {
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }

  function verify() {
    if (!process.env.RESEND_API_KEY) throw configurationError('RESEND_API_KEY is required');
    if (!process.env.RESEND_FROM_EMAIL) {
      throw configurationError('RESEND_FROM_EMAIL is required');
    }
    return true; // Configuration check only; does not send a health-check email.
  }

  return {
    verify,
    async sendMail(options) {
      verify();
      if (options.sandboxMode || options.mailSettings?.sandboxMode?.enable) {
        throw configurationError('Resend does not support sandboxMode');
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
        const detail = safeErrorDetail(error.response?.data?.message);
        const message = status ? `Resend email request failed (HTTP ${status})` : 'Resend email request failed';
        throw Object.assign(new Error(`${message}${detail ? `: ${detail}` : ''}`), {
          statusCode: status,
          code: safeErrorDetail(error.response?.data?.name) || 'resend_request_failed',
          retryable: !status || status === 408 || status === 429 || status >= 500,
        });
      }
    },
  };
}

module.exports = { createTransport };
