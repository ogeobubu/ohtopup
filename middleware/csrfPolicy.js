const PUBLIC_MUTATIONS = new Set([
  '/api/users/newsletter/subscribe',
  '/api/users/newsletter/unsubscribe',
  '/api/users/admin/auth/login',
  '/api/users/admin/auth/refresh',
  '/api/users/login',
  '/api/users/create',
  '/api/users/forgot',
  '/api/users/reset',
  '/api/users/resend-otp',
  '/api/users/verify',
  '/api/users/refresh',
  '/api/auth/refresh',
  '/api/users/wallet/deposit/paystack/webhook',
]);

const shouldSkipCsrf = req =>
  /^Bearer [^ ]+$/i.test(req.headers.authorization || '') || PUBLIC_MUTATIONS.has(req.path);

module.exports = { shouldSkipCsrf };
