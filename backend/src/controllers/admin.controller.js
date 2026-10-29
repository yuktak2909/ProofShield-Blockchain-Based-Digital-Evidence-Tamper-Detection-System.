const bcrypt = require("bcryptjs");
const { User, Case, Evidence, CustodyLog } = require("../models");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role", "walletAddress", "createdAt"],
      order: [["createdAt", "DESC"]]
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error("Admin getUsers error:", error);
    return res.status(500).json({ error: "Failed to retrieve user accounts." });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, walletAddress } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Name, email, password, and role are required." });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already in use." });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      walletAddress
    });

    return res.status(201).json({
      message: "User account created successfully.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        walletAddress: newUser.walletAddress
      }
    });
  } catch (error) {
    console.error("Admin createUser error:", error);
    return res.status(500).json({ error: "Failed to create user account: " + error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, walletAddress, password } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User account not found." });
    }

    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        return res.status(400).json({ error: "Email is already in use by another user." });
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (walletAddress) user.walletAddress = walletAddress;
    
    if (password) {
      user.passwordHash = bcrypt.hashSync(password, 10);
    }

    await user.save();

    return res.status(200).json({
      message: "User account updated successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress
      }
    });
  } catch (error) {
    console.error("Admin updateUser error:", error);
    return res.status(500).json({ error: "Failed to update user account." });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own active administrator session." });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User account not found." });
    }

    await user.destroy();
    return res.status(200).json({ message: "User account deleted successfully." });
  } catch (error) {
    console.error("Admin deleteUser error:", error);
    return res.status(500).json({ error: "Failed to delete user account." });
  }
};

// Global dashboard analytics stats endpoint
exports.getSystemStats = async (req, res) => {
  try {
    const totalCases = await Case.count();
    const totalEvidence = await Evidence.count();
    
    const verifiedEvidence = await Evidence.count({ where: { status: "REGISTERED" } });
    
    // Count verification logs by outcome
    const totalVerifications = await require("../models/VerificationLog").count();
    const tamperAlerts = await require("../models/VerificationLog").count({
      where: { result: "tampered" }
    });
    
    const totalCustodyEvents = await CustodyLog.count();

    // Get recent activity
    const recentEvidence = await Evidence.findAll({
      limit: 5,
      include: [
        { model: Case, as: "case", attributes: ["caseNumber"] },
        { model: User, as: "submitter", attributes: ["name"] }
      ],
      order: [["submitted_at", "DESC"]]
    });

    const recentCustody = await CustodyLog.findAll({
      limit: 5,
      include: [
        { model: User, as: "actor", attributes: ["name", "role"] },
        { model: Evidence, as: "evidence", attributes: ["evidenceName"] }
      ],
      order: [["timestamp", "DESC"]]
    });

    return res.status(200).json({
      stats: {
        totalCases,
        totalEvidence,
        verifiedEvidence,
        tamperAlerts,
        totalVerifications,
        totalCustodyEvents
      },
      recentEvidence,
      recentCustody
    });
  } catch (error) {
    console.error("Get system stats error:", error);
    return res.status(500).json({ error: "Failed to load dashboard analytics stats." });
  }
};
