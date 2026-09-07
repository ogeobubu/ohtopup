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

test('Resend exposes the rejection reason without exposing credentials', async (t) => {
  const original = { ...process.env };
  t.after(() => { process.env = original; });
  process.env.EMAIL_PROVIDER = 'resend';
  process.env.RESEND_API_KEY = 'test-secret';
  process.env.RESEND_FROM_EMAIL = 'mail@example.com';
  const post = t.mock.method(axios, 'post', async () => {
    throw { response: { status: 403, data: { name: 'validation_error', message: 'The example.com domain is not verified. test-secret Bearer private-token re_privatekey' } } };
  });
  const transport = createTransport();
  await assert.rejects(transport.sendMail({ to: 'user@example.com' }), error => {
    assert.match(error.message, /example.com domain is not verified/);
    assert.doesNotMatch(error.message, /test-secret|private-token|re_privatekey/);
    assert.equal(error.code, 'validation_error');
    assert.equal(error.statusCode, 403);
    assert.equal(error.retryable, false);
    assert.equal(error.config, undefined);
    return true;
  });
  for (const status of [429, 503]) {
    post.mock.mockImplementation(async () => { throw { response: { status } }; });
    await assert.rejects(transport.sendMail({ to: 'user@example.com' }), error => error.retryable === true);
  }
});

test('Permission failures are attempted once and retained for later delivery', async () => {
  const fs = require('node:fs');
  const vm = require('node:vm');
  const path = require('node:path');
  const filename = path.resolve(__dirname, '../services/emailService.js');
  const localRequire = require('node:module').createRequire(filename);
  const sandbox = {
    module: { exports: {} }, process: { env: { EMAIL_PROVIDER: 'resend' } },
    console: { log() {}, error() {} },
    setInterval: () => ({ unref() {} }),
    require: name => name === '../controllers/systemLogController' ? { createLog: async () => {} } : localRequire(name),
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  const service = sandbox.module.exports;
  let attempts = 0;
  let stored;
  service.transporter = { sendMail: async () => { attempts++; throw Object.assign(new Error('Domain not verified'), { retryable: false }); } };
  service.storeEmailToFile = async data => { stored = data; return { filename: 'queued.json' }; };
  const result = await service.sendEmail({ to: 'user@example.com', subject: 'Login notification' });
  assert.equal(attempts, 1);
  assert.equal(stored.subject, 'Login notification');
  assert.equal(result.success, false);
  assert.equal(result.stored, true);
  assert.equal(result.retryable, false);
  assert.equal(result.error, 'Domain not verified');
});
