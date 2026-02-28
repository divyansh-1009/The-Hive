// controllers/authController.js

const bcrypt = require("bcrypt");
const { randomUUID } = require("crypto");
const User = require("../models/User");
const Device = require("../models/Device");
const { generateToken } = require("../middleware/auth");
const { PERSONA_ROLES } = require("../config/categories");

// POST /api/auth/register
// Body: { name, email, password, deviceId, deviceType, personaRole }
async function register(req, res) {
  try {
    const { name, email, password, deviceId, deviceType, personaRole } = req.body;

    if (!name || !email || !password || !deviceId || !deviceType) {
      return res.status(400).json({ error: "All fields required" });
    }

    // Validate persona role, default to GENERAL
    const role = PERSONA_ROLES[personaRole] || "GENERAL";

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create(userId, name, email, passwordHash, role);

    await Device.link(deviceId, userId, deviceType);

    const token = generateToken(userId);
    return res.status(201).json({ userId, token, personaRole: role });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// POST /api/auth/login
// Body: { email, password, deviceId, deviceType }
async function login(req, res) {
  try {
    const { email, password, deviceId, deviceType } = req.body;

    const user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    // Link device if provided (for new devices logging in)
    if (deviceId && deviceType) {
      await Device.link(deviceId, user.user_id, deviceType);
    }

    const token = generateToken(user.user_id);
    return res.status(200).json({
      userId: user.user_id,
      token,
      personaRole: user.persona_role,
    });
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

// PATCH /api/auth/persona
// Body: { personaRole }
async function updatePersona(req, res) {
  try {
    const { personaRole } = req.body;

    if (!PERSONA_ROLES[personaRole]) {
      return res.status(400).json({
        error: "Invalid persona role",
        valid: Object.keys(PERSONA_ROLES),
      });
    }

    await User.updatePersona(req.userId, personaRole);
    return res.status(200).json({ message: "Persona updated", personaRole });
  } catch (err) {
    console.error("Update persona error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { register, login, linkDevice, updatePersona };