const crypto = require('crypto');

module.exports = (req, res, next) => {
  const secret = process.env.BACKGROUND_JOB_SECRET;
  const match = /^Bearer ([^ ]+)$/i.exec(req.headers.authorization || '');
  if (!secret) return res.status(503).json({ message: 'Background jobs are not configured' });
  if (!match) return res.status(401).json({ message: 'Unauthorized' });
  const supplied = Buffer.from(match[1]);
  const expected = Buffer.from(secret);
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};
