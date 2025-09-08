const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const Variation = require("./model/Variation");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const walletRoutes = require("./routes/walletRoutes");
const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoutes").authRouter
const xRoutes = require("./routes/xRoutes");
const airtimeRoutes = require("./routes/airtimeRoutes");
require("dotenv").config();
const path = require("path");
const xController = require("./controllers/xController");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const csurf = require("csurf");

const { handleServiceError } = require('./middleware/errorHandler');

const app = express();

// Use helmet to set secure HTTP headers with CSP configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://www.googleapis.com", "https://api.paystack.co", "https://checkout.paystack.com"],
        frameSrc: ["'self'", "https://checkout.paystack.com"],
        objectSrc: ["'none'"],
      },
    },
  })
);

// Rate limiting: max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Skip rate limiting for CSRF token endpoint
app.use((req, res, next) => {
  if (req.path === '/api/csrf-token') {
    return next();
  }
  limiter(req, res, next);
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_default_secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only true in prod
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);


app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.set('trust proxy', 1);

app.use(express.json());

// Database connection check middleware
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database connection not ready. Please try again later.'
    });
  }
  next();
});

// CSRF protection (after session/cookie parser, before routes)
// Skip CSRF for newsletter subscription and admin login (public endpoints)
app.use((req, res, next) => {
  if (req.path === '/api/users/newsletter/subscribe' ||
      req.path === '/api/users/newsletter/unsubscribe' ||
      req.path === '/api/users/admin/auth/login') {
    return next();
  }
  csurf()(req, res, next);
});

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus
  });
});

const PORT = process.env.PORT || 5001;

const connectToDatabase = async () => {
  try {
    // Set connection options for better reliability
    const options = {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log("MongoDB connected successfully");

    // Add connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
};

// Start server only after database connection is established
const startServer = async () => {
  try {
    await connectToDatabase();

    xController.setTwitterClient(null);

    app.use("/api/users", userRoutes);
    app.use("/api/users/admin", adminRoutes);
    app.use("/api/users/wallet", walletRoutes);
    app.use("/api/users/chat", chatRoutes);
    app.use("/api/users/admin/chat", chatRoutes);
    app.use("/api/users/admin/auth", authRoutes);
    app.use("/api/users/admin/x", xRoutes);
    app.use("/api/users", airtimeRoutes);

    xController.startRepostJob();

    const frontendBuildPath = path.join(__dirname, "client/dist");
    const clientPublicPath = path.join(__dirname, "client/public");

    // Serve static files from client/dist (production build)
    app.use(express.static(frontendBuildPath));

    // Serve static files from client/public (includes sitemap.xml, robots.txt)
    app.use(express.static(clientPublicPath));

    // Specific route for sitemap.xml to ensure correct content-type
    app.get("/sitemap.xml", (req, res) => {
      const sitemapPath = path.join(clientPublicPath, "sitemap.xml");
      res.setHeader("Content-Type", "application/xml");
      res.sendFile(sitemapPath, (err) => {
        if (err) {
          console.error("Error serving sitemap.xml:", err);
          res.status(404).send("Sitemap not found");
        }
      });
    });

    // Specific route for robots.txt
    app.get("/robots.txt", (req, res) => {
      const robotsPath = path.join(clientPublicPath, "robots.txt");
      res.setHeader("Content-Type", "text/plain");
      res.sendFile(robotsPath, (err) => {
        if (err) {
          console.error("Error serving robots.txt:", err);
          res.status(404).send("Robots.txt not found");
        }
      });
    });

    // Catch-all route for React app (must be last)
    app.get("*", (req, res) => {
      res.sendFile(path.join(frontendBuildPath, "index.html"));
    });

    // Error handler for CSRF errors (add before your main error handler)
    app.use((err, req, res, next) => {
      if (err.code === "EBADCSRFTOKEN") {
        return res.status(403).json({ message: "Invalid CSRF token" });
      }
      next(err);
    });

    app.use(handleServiceError);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();