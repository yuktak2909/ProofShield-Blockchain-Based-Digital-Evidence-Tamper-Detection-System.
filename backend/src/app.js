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

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for our React app
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static public folder if needed
app.use("/public", express.static(path.join(__dirname, "../public")));

// Check DB Connection
sequelize.authenticate()
  .then(() => {
    console.log("Database connected successfully to PostgreSQL.");
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
app.use("/api", verifyRoutes);             // Verify endpoints mounted directly under /api (/api/verify, /api/evidence/:id/verifications)
app.use("/api/admin", adminRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled API Error:", err);

  // Multer error handling
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File size limit exceeded. Maximum file size allowed is 50MB." });
  }

  // General errors
  return res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
    error: err.message || "An internal server error occurred."
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`ProofShield API Server is running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
});
