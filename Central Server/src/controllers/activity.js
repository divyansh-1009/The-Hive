// controllers/activity.js

const Session = require("../models/Session");
const Device = require("../models/Device");
const Activity = require("../models/Activity");
const { broadcastUpdate } = require("./liveController");
const { categorize } = require("./embeddingController");
const { MIN_SESSION_SECONDS } = require("../config/scoring");

/**
 * Resolve category for an app/site using the embedding pipeline
 * Returns category string or "UNCAT"
 */
async function resolveCategory(appOrSite, source) {
  const result = await categorize(appOrSite, source);
  return result.category || "UNCAT";
}

/**
 * Compute actual active duration for a session, accounting for idle pauses.
 * accumulatedMs tracks time banked before idle pauses.
 * If currently idle, only return accumulated time.
 * If active, return accumulated + time since last resume/start.
 */
function computeSessionDuration(session, closeTimestamp) {
  if (session.idleState === "IDLE" || session.idleState === "LOCKED") {
    return session.accumulatedMs || 0;
  }
  return (session.accumulatedMs || 0) + (closeTimestamp - session.timestamp);
}

/**
 * Finalize a session and accumulate into daily activity.
 * Sessions shorter than MIN_SESSION_SECONDS are silently discarded.
 */
async function finalizeSession(session, closeTimestamp) {
  const durationMs = computeSessionDuration(session, closeTimestamp);

  if (durationMs < MIN_SESSION_SECONDS * 1000) return null;

  const durationMinutes = durationMs / 60000;
  const category = await resolveCategory(session.site, "chrome");
  const date = new Date(session.timestamp).toISOString().split("T")[0];

  await Activity.addCategoryTime(session.userId, date, category, durationMinutes);
  return { site: session.site, durationMinutes, category };
}

// POST /api/activity/chrome
// Body: { deviceId, site, state, idleState, timestamp }
// state: "active" | "closed"
// idleState: "ACTIVE" | "IDLE" | "LOCKED" (sent by extension every 30s)
async function handleChromeEvent(req, res) {
  try {
    const { deviceId, site, state, idleState, timestamp } = req.body;

    if (!deviceId || !state || !timestamp) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userId = await Device.getUserId(deviceId);
    if (!userId) {
      return res.status(404).json({ error: "Device not linked to any user" });
    }

    let finalized = null;
    const existing = Session.get(deviceId);
    const newIdleState = idleState || "ACTIVE";

    if (state === "active") {
      if (!site) {
        return res.status(400).json({ error: "Site required for active state" });
      }

      // Implicitly close previous session if exists
      if (existing) {
        finalized = await finalizeSession(existing, timestamp);
      }

      // Start new session
      Session.set(deviceId, {
        userId,
        site,
        timestamp,
        idleState: newIdleState,
        accumulatedMs: 0,
      });
      broadcastUpdate();

    } else if (state === "closed") {
      if (!existing) {
        return res.status(200).json({ message: "No active session to close, discarded" });
      }

      finalized = await finalizeSession(existing, timestamp);
      Session.remove(deviceId);
      broadcastUpdate();

    } else {
      return res.status(400).json({ error: "Invalid state. Use 'active' or 'closed'" });
    }

    // Handle idle state transitions on existing session
    // Extension sends idleState with every event — detect transitions
    if (state === "active" && existing === null) {
      // Fresh session, nothing to transition
    } else if (Session.get(deviceId)) {
      const current = Session.get(deviceId);
      const prevIdle = current.idleState || "ACTIVE";

      if (prevIdle === "ACTIVE" && (newIdleState === "IDLE" || newIdleState === "LOCKED")) {
        // Transition: ACTIVE → IDLE/LOCKED — bank active time, pause timer
        current.accumulatedMs = (current.accumulatedMs || 0) + (timestamp - current.timestamp);
        current.idleState = newIdleState;

      } else if ((prevIdle === "IDLE" || prevIdle === "LOCKED") && newIdleState === "ACTIVE") {
        // Transition: IDLE/LOCKED → ACTIVE — resume timer from now
        current.timestamp = timestamp;
        current.idleState = "ACTIVE";

      } else {
        // Same state — just update the idleState field
        current.idleState = newIdleState;
      }
      broadcastUpdate();
    }

    return res.status(200).json({
      message: "Event processed",
      finalized,
      idleState: newIdleState,
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