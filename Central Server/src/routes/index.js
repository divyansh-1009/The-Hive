// routes/index.js

const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/auth");
const { register, login, linkDevice, updatePersona } = require("../controllers/authController");
const { handleChromeEvent, handleMobileSync } = require("../controllers/activity");
const { getScore } = require("../controllers/scoring");
const { getRating, getLeaderboard, getDomainRankings, getEODSummary } = require("../controllers/rating");

// --- Auth ---
router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/link-device", authenticateToken, linkDevice);
router.patch("/auth/persona", authenticateToken, updatePersona);

// --- Activity Ingestion ---
router.post("/activity/chrome", authenticateToken, handleChromeEvent);
router.post("/activity/mobile", authenticateToken, handleMobileSync);

// --- Scoring & Rating ---
router.get("/score", authenticateToken, getScore);
router.get("/rating", authenticateToken, getRating);
router.get("/ranking/domain", authenticateToken, getDomainRankings);
router.get("/summary/:date", authenticateToken, getEODSummary);

// --- Leaderboard (public, anonymous) ---
router.get("/leaderboard", getLeaderboard);

module.exports = router;