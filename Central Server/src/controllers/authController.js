// controllers/authController.js

const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const Device = require("../models/Device");
const { generateToken } = require("../middleware/auth");

// POST /api/auth/register
// Body: { email, password, deviceId, deviceType }
async function register(req, res) {
  try {
    const { email, password, deviceId, deviceType } = req.body;

    if (!email || !password || !deviceId || !deviceType) {
      return res.status(400).json({ error: "All fields required" });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create(userId, email, passwordHash);

    // Link the device to this user
    await Device.link(deviceId, userId, deviceType);

    const token = generateToken(userId);
    return res.status(201).json({ userId, token });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// POST /api/auth/login
// Body: { email, password }
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken(user.user_id);
    return res.status(200).json({ userId: user.user_id, token });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// POST /api/auth/link-device
// Body: { deviceId, deviceType }
async function linkDevice(req, res) {
  try {
    const { deviceId, deviceType } = req.body;
    if (!deviceId || !deviceType) {
      return res.status(400).json({ error: "deviceId and deviceType required" });
    }

    await Device.link(deviceId, req.userId, deviceType);
    return res.status(200).json({ message: "Device linked" });
  } catch (err) {
    console.error("Link device error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { register, login, linkDevice };