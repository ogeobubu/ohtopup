const { test } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const { createTransport } = require('../services/emailTransport');

test('Resend transport maps messages, protects BCC, and sanitizes errors', async (t) => {
  const original = { ...process.env };
  t.after(() => { process.env = original; });
  process.env.EMAIL_PROVIDER = 'resend';
  process.env.RESEND_API_KEY = 'test-secret';
  process.env.RESEND_FROM_EMAIL = 'mail@example.com';
  process.env.FROM_NAME = 'OhTopUp';
  const post = t.mock.method(axios, 'post', async () => ({ data: { id: 'email-123' } }));
  const transport = createTransport();
  assert.deepEqual(await transport.sendMail({ to: 'user@example.com', subject: 'Code', html: '<p>123456</p>', emailType: 'verification' }), { messageId: 'email-123' });
  const [url, payload, config] = post.mock.calls[0].arguments;
  assert.equal(url, 'https://api.resend.com/emails');
  assert.equal(payload.from, 'OhTopUp <mail@example.com>');
  assert.deepEqual(payload.to, ['user@example.com']);
  assert.equal(payload.emailType, undefined);
  assert.equal(config.headers.Authorization, 'Bearer test-secret');
  await transport.sendMail({ bcc: ['one@example.com', 'two@example.com'], subject: 'Newsletter' });
  assert.deepEqual(post.mock.calls[1].arguments[1].to, ['mail@example.com']);
  assert.deepEqual(post.mock.calls[1].arguments[1].bcc, ['one@example.com', 'two@example.com']);
  post.mock.mockImplementation(async () => { throw Object.assign(new Error('test-secret'), { response: { status: 403 } }); });
  await assert.rejects(transport.sendMail({ to: 'user@example.com' }), { message: 'Resend email request failed (HTTP 403)' });
  delete process.env.RESEND_API_KEY;
  await assert.rejects(transport.sendMail({}), /RESEND_API_KEY is required/);
});
