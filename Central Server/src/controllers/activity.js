// controllers/activity.js

const Session = require("../models/Session");
const Device = require("../models/Device");
const Activity = require("../models/Activity");
const { STALE_SESSION_THRESHOLD_MS } = require("../config/scoring");
const { broadcastUpdate } = require("./liveController");
const { categorize } = require("./embeddingController");

/**
 * Resolve category for an app/site using the embedding pipeline
 * Returns category string or "UNCAT"
 */
async function resolveCategory(appOrSite, source) {
  const result = await categorize(appOrSite, source);
  // If below threshold, categorize returned null → use UNCAT
  return result.category || "UNCAT";
}

// Helper: finalize a session and accumulate into daily activity
async function finalizeSession(session, closeTimestamp) {
  const durationMs = closeTimestamp - session.timestamp;

  // Discard if exceeds stale threshold or invalid
  if (durationMs > STALE_SESSION_THRESHOLD_MS || durationMs <= 0) return null;

  const durationMinutes = durationMs / 60000;
  const category = await resolveCategory(session.site, "chrome");
  const date = new Date(session.timestamp).toISOString().split("T")[0];

  await Activity.addCategoryTime(session.userId, date, category, durationMinutes);
  return { site: session.site, durationMinutes, category };
}

// POST /api/activity/chrome
// Body: { deviceId, site, state, timestamp }
async function handleChromeEvent(req, res) {
  try {
    const { deviceId, site, state, timestamp } = req.body;

    if (!deviceId || !site || !state || !timestamp) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userId = await Device.getUserId(deviceId);
    if (!userId) {
      return res.status(404).json({ error: "Device not linked to any user" });
    }

    let finalized = null;

    if (state === "active") {
      const existing = Session.get(deviceId);
      if (existing) {
        finalized = await finalizeSession(existing, timestamp);
      }
      Session.set(deviceId, { userId, site, timestamp });
      broadcastUpdate();

    } else if (state === "closed") {
      const existing = Session.get(deviceId);
      if (!existing) {
        return res.status(200).json({ message: "No active session to close, discarded" });
      }
      finalized = await finalizeSession(existing, timestamp);
      Session.remove(deviceId);
      broadcastUpdate();

    } else {
      return res.status(400).json({ error: "Invalid state. Use 'active' or 'closed'" });
    }

    return res.status(200).json({
      message: "Event processed",
      finalized,
      activeSession: Session.get(deviceId) || null,
    });
  } catch (err) {
    console.error("Chrome event error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// POST /api/activity/mobile
// Body: { deviceId, date, apps: [{ appName, durationMs }] }
async function handleMobileSync(req, res) {
  try {
    const { deviceId, date, apps } = req.body;

    if (!deviceId || !date || !Array.isArray(apps)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userId = await Device.getUserId(deviceId);
    if (!userId) {
      return res.status(404).json({ error: "Device not linked to any user" });
    }

    const results = [];

    for (const app of apps) {
      const { appName, durationMs } = app;
      const durationMinutes = durationMs / 60000;
      const category = await resolveCategory(appName, "mobile");

      await Activity.addCategoryTime(userId, date, category, durationMinutes);
      results.push({ appName, durationMinutes, category });
    }

    return res.status(200).json({ message: "Mobile sync processed", results });
  } catch (err) {
    console.error("Mobile sync error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { handleChromeEvent, handleMobileSync };