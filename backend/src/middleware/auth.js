const jwt = require("jsonwebtoken");
const { User } = require("../models");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../../../.env") });
const JWT_SECRET = process.env.JWT_SECRET || "supersecretproofshieldtokenkey12345";

/**
 * Protect middleware: Verifies JWT token and appends user to request.
 */
async function protect(req, res, next) {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ error: "Access denied. No authentication token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "The user belonging to this token no longer exists." });
    }

    // Attach user information to request
    req.user = user;
    next();
  } catch (error) {
    console.error("JWT validation error:", error.message);
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

/**
 * Restrict routes to specific roles.
 * @param {...string} roles - Permitted roles (investigator, analyst, court, admin)
 */
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({ error: "User context not found. Auth protect middleware is required." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Permission denied. Your role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
}

module.exports = {
  protect,
  restrictTo
};
