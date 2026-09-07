const jwt = require('jsonwebtoken');
const User = require('../model/User');
module.exports = async (req, res, next) => {
  const match = /^Bearer ([^ ]+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ message: 'Unauthorized' });
  let payload;
  try { payload = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { return res.status(401).json({ message: 'Invalid token' }); }
  try {
    const id = payload?.user?.id || payload?.user?._id;
    if (!id || !require('mongoose').isValidObjectId(id)) return res.status(401).json({ message: 'Invalid token' });
    const user = await User.findById(id).select('role email isDeleted');
    if (!user || user.isDeleted) return res.status(401).json({ message: 'Account unavailable' });
    req.user = { id: String(user._id), role: user.role, email: user.email };
    next();
  } catch (error) { next(error); }
};
