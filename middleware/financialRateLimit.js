const { rateLimit } = require('express-rate-limit');
// Applied after authentication; failed PIN/payment requests share a per-account limit.
module.exports = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: req => String(req.user.id),
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many failed attempts. Please try again in 15 minutes.' },
});
