// Client-provided identities are never authority for a wallet operation.
module.exports = (req, res, next) => {
  const id = String(req.user.id);
  for (const data of [req.body, req.query]) {
    if (data?.userId !== undefined && String(data.userId) !== id) {
      return res.status(403).json({ message: 'You can only operate your own wallet.' });
    }
  }
  req.body = { ...req.body, userId: id };
  next();
};
