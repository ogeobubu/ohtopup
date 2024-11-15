const express = require("express");
const {
  loginAdmin,
  getAdmin,
  getAllUsers,
} = require("../controllers/adminController");
const authUser = require("../middleware/authMiddleware");
const authAdmin = require("../middleware/adminMiddleware");
const router = express.Router();

router.post("/login", loginAdmin);
router.get("/", authUser, authAdmin, getAdmin);
router.get("/users", authUser, authAdmin, getAllUsers);

module.exports = router;
