const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const Variation = require("./model/Variation");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const walletRoutes = require("./routes/walletRoutes");
const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoutes").authRouter;
const xRoutes = require("./routes/xRoutes");
require("dotenv").config();
const path = require("path");
const xController = require("./controllers/xController");

const app = express();

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_default_secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);
app.use(express.json());

const PORT = process.env.PORT || 5000;

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
};

connectToDatabase();

xController.setTwitterClient(null);

app.use("/api/users", userRoutes);
app.use("/api/users/admin", adminRoutes);
app.use("/api/users/wallet", walletRoutes);
app.use("/api/users/chat", chatRoutes);
app.use("/api/users/admin/chat", chatRoutes);

app.use("/api/users/admin/auth", authRoutes);
app.use("/api/users/admin/x", xRoutes);

xController.startRepostJob();

const frontendBuildPath = path.join(__dirname, "client/dist");
app.use(express.static(frontendBuildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});