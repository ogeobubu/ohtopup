const adminMiddleware = (req, res, next) => {
  const user = req.user;

  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  next();
};

module.exports = adminMiddleware;
