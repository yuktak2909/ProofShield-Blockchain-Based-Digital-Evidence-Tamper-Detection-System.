const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../models");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../../../.env") });
const JWT_SECRET = process.env.JWT_SECRET || "supersecretproofshieldtokenkey12345";

const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: "24h"
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, walletAddress } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields: name, email, password, role are required." });
    }

    const roles = ["investigator", "analyst", "court", "admin"];
    if (!roles.includes(role)) {
      return res.status(400).json({ error: "Invalid role. Role must be: investigator, analyst, court, or admin." });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered." });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      walletAddress
    });

    const token = signToken(user.id);

    return res.status(201).json({
      message: "User registered successfully.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Registration failed due to server error: " + error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user.id);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed due to server error: " + error.message });
  }
};

exports.me = async (req, res) => {
  try {
    // req.user is populated by protect middleware
    return res.status(200).json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        walletAddress: req.user.walletAddress
      }
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ error: "Server error retrieving profile." });
  }
};
