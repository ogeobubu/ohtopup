const User = require("../model/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, isDeleted: false });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const payload = { user: { id: user._id, role: user.role } };
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });

    res.status(200).json({ message: "Login successful!", token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const getAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllUsers = async (req, res) => {
  const { page = 1, limit = 10, search = "", role } = req.query;

  const query = { isDeleted: false };

  if (role) {
    query.role = role;
  }

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  try {
    const users = await User.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const totalCount = await User.countDocuments(query);

    res.status(200).json({ users, totalCount });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  loginAdmin,
  getAdmin,
  getAllUsers,
};
