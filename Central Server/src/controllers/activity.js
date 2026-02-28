// controllers/activity.js

const Session = require("../models/Session");
const Device = require("../models/Device");
const Activity = require("../models/Activity");
const UncategorizedQueue = require("../models/UncategorizedQueue");
const { getCategory } = require("../config/categories");
const { STALE_SESSION_THRESHOLD_MS } = require("../config/scoring");
const { broadcastUpdate } = require("./liveController");

// Helper: finalize a session and accumulate into daily activity
async function finalizeSession(session, closeTimestamp) {
  const durationMs = closeTimestamp - session.timestamp;

  // Discard if exceeds stale threshold or invalid
  if (durationMs > STALE_SESSION_THRESHOLD_MS || durationMs <= 0) return null;

  const durationMinutes = durationMs / 60000;
  const category = getCategory(session.site);
  const date = new Date(session.timestamp).toISOString().split("T")[0];

  if (!category) {
    await UncategorizedQueue.add(session.site, "chrome");
    return { site: session.site, durationMinutes, category: null, queued: true };
  }

  await Activity.addCategoryTime(session.userId, date, category, durationMinutes);
  return { site: session.site, durationMinutes, category, queued: false };
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
      // Check if there's an existing active session → implicitly close it
      const existing = Session.get(deviceId);
      if (existing) {
        finalized = await finalizeSession(existing, timestamp);
      }
      // Store the new active session
      Session.set(deviceId, { userId, site, timestamp });

      // Broadcast live update — new session started
      broadcastUpdate();

    } else if (state === "closed") {
      const existing = Session.get(deviceId);
      if (!existing) {
        return res.status(200).json({ message: "No active session to close, discarded" });
      }
      finalized = await finalizeSession(existing, timestamp);
      Session.remove(deviceId);

      // Broadcast live update — session ended
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
      const category = getCategory(appName);

      if (!category) {
        await UncategorizedQueue.add(appName, "mobile");
        results.push({ appName, durationMinutes, category: null, queued: true });
        continue;
      }

      await Activity.addCategoryTime(userId, date, category, durationMinutes);
      results.push({ appName, durationMinutes, category, queued: false });
    }

    return res.status(200).json({ message: "Mobile sync processed", results });
  } catch (err) {
    console.error("Mobile sync error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { handleChromeEvent, handleMobileSync };