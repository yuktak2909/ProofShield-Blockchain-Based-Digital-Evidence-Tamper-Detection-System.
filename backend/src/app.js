const express = require("express");
const cors = require("cors");
const path = require("path");
const { sequelize } = require("./models");
const rateLimiter = require("./middleware/rate-limiter");

// Load routers
const authRoutes = require("./routes/auth.routes");
const casesRoutes = require("./routes/cases.routes");
const evidenceRoutes = require("./routes/evidence.routes");
const custodyRoutes = require("./routes/custody.routes");
const verifyRoutes = require("./routes/verify.routes");
const adminRoutes = require("./routes/admin.routes");
const auditRoutes = require("./routes/audit.routes");
const reportsRoutes = require("./routes/reports.routes");
const notificationsRoutes = require("./routes/notifications.routes");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for our React app (allowing both localhost and 127.0.0.1)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1):5173$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

// Parsers
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Serve static public folder and demonstration files
app.use("/public", express.static(path.join(__dirname, "../public")));
app.use("/uploads/demo_files", express.static(path.join(__dirname, "../uploads/demo_files")));

// Check DB Connection & sync schema
sequelize.authenticate()
  .then(async () => {
    console.log("Database connected successfully to PostgreSQL.");
    try {
      await sequelize.sync();
      console.log("Database schema models verified.");
    } catch (sErr) {
      console.warn("Schema sync note:", sErr.message);
    }
  })
  .catch((err) => {
    console.error("CRITICAL ERROR: Unable to connect to the database:", err.message);
  });

// Apply rate limiting to auth and verify routes
app.use("/api/auth/login", rateLimiter);
app.use("/api/auth/register", rateLimiter);
app.use("/api/verify", rateLimiter);

// Mount API Routes
app.use("/api/auth", authRoutes);
app.use("/api/cases", casesRoutes);
app.use("/api/evidence", evidenceRoutes); // General evidence routes
app.use("/api/evidence", custodyRoutes);    // Custody events mounted under /api/evidence
app.use("/api/custody", custodyRoutes);     // Custody transfer & acceptance routes
app.use("/api", verifyRoutes);             // Verify endpoints mounted directly under /api (/api/verify, /api/evidence/:id/verifications)
app.use("/api/admin", adminRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/notifications", notificationsRoutes);

// Health check endpoints
const blockchainService = require("./services/blockchain.service");

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

app.get("/api/health/blockchain", async (req, res) => {
  try {
    const health = await blockchainService.getBlockchainHealth();
    return res.status(200).json(health);
  } catch (error) {
    return res.status(500).json({ error: "Failed to evaluate blockchain health: " + error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error("Unhandled API Error:", err.message);

  // Multer error handling
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File size limit exceeded. Maximum file size allowed is 250MB." });
  }

  // General errors
  const statusCode = err.status || (res.statusCode >= 400 ? res.statusCode : 500);
  return res.status(statusCode).json({
    error: err.message || "An internal server error occurred."
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`ProofShield API Server is running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
});
