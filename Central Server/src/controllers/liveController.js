// controllers/liveController.js

const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const Session = require("../models/Session");
const Activity = require("../models/Activity");
const User = require("../models/User");
const { SEED_MAPPINGS } = require("../config/categories");

// Build a quick sync lookup from seed mappings for live stats
const quickCategoryMap = {};
for (const { name, category } of SEED_MAPPINGS) {
  quickCategoryMap[name] = category;
}
function getCategory(site) {
  return quickCategoryMap[site] || "UNKNOWN";
}
const { JWT_SECRET } = require("../middleware/auth");

let wss = null;

// Map of userId -> Set of WebSocket clients (one user can have multiple tabs)
const authenticatedClients = new Map();

/**
 * Initialize WebSocket server with JWT authentication
 * Connect via: ws://host:port/ws/live?token=<jwt>
 */
function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: "/ws/live" });

  wss.on("connection", async (ws, req) => {
    // Extract token from query string
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) {
      ws.send(JSON.stringify({ type: "error", message: "Token required" }));
      ws.close();
      return;
    }

    let userId;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
      ws.close();
      return;
    }

    // Register authenticated client
    if (!authenticatedClients.has(userId)) {
      authenticatedClients.set(userId, new Set());
    }
    authenticatedClients.get(userId).add(ws);
    ws.userId = userId;

    console.log(`WebSocket client connected: ${userId}`);

    // Send initial personalized snapshot
    const snapshot = await buildPersonalizedSnapshot(userId);
    ws.send(JSON.stringify(snapshot));

    ws.on("close", () => {
      const clients = authenticatedClients.get(userId);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) authenticatedClients.delete(userId);
      }
      console.log(`WebSocket client disconnected: ${userId}`);
    });
  });

  console.log("WebSocket live stats available at /ws/live?token=<jwt>");
}

/**
 * Build global stats from active sessions
 * Filters out idle/locked users from counts
 */
function buildGlobalStats() {
  const sessions = Session.getAll();
  
  // Separate active from idle/locked
  let totalActive = 0;
  let totalIdle = 0;
  let totalLocked = 0;

  const categoryBreakdown = {};
  const activeSites = {};

  for (const [deviceId, session] of sessions) {
    const idleState = session.idleState || "ACTIVE";
    
    if (idleState === "IDLE") {
      totalIdle++;
    } else if (idleState === "LOCKED") {
      totalLocked++;
    } else {
      totalActive++;
      const category = getCategory(session.site) || "UNKNOWN";
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
      activeSites[session.site] = (activeSites[session.site] || 0) + 1;
    }
  }

  const topSites = Object.entries(activeSites)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([site, count]) => ({ site, count }));

  return { 
    totalActive, 
    totalIdle,
    totalLocked,
    categoryBreakdown, 
    topSites 
  };
}

/**
 * Compute live per-category ranking for a specific user
 * Shows: how many people are active in each category right now,
 * and where this user ranks by accumulated time today in each category
 */
async function buildLiveRanking(userId) {
  const today = new Date().toISOString().split("T")[0];
  const userTotals = await Activity.getDailyTotals(userId, today);

  const rankings = {};

  for (const [category, minutes] of Object.entries(userTotals)) {
    const allScores = await Activity.getCategoryScores(today, category);
    const nc = allScores.length;
    if (nc === 0) continue;

    // Count how many the user is ahead of
    const countBelow = allScores.filter(
      (r) => parseFloat(r.total_minutes) <= minutes
    ).length;
    const percentile = countBelow / nc;
    const rank = nc - countBelow + 1;

    // Count currently active in this category
    let currentlyActive = 0;
    for (const [, session] of Session.getAll()) {
      const cat = getCategory(session.site);
      if (cat === category) currentlyActive++;
    }

    rankings[category] = {
      yourMinutes: Math.round(minutes * 10) / 10,
      rank,
      totalUsers: nc,
      percentile: Math.round(percentile * 10000) / 100,
      currentlyActive,
    };
  }

  return rankings;
}

/**
 * Build a full personalized snapshot for a connected user
 */
async function buildPersonalizedSnapshot(userId) {
  const global = buildGlobalStats();
  const liveRanking = await buildLiveRanking(userId);

  return {
    type: "live_stats",
    timestamp: Date.now(),
    global,
    you: {
      liveRanking,
    },
  };
}

/**
 * Broadcast updated stats to all connected authenticated clients
 * Each client gets their own personalized ranking
 */
async function broadcastUpdate() {
  if (!wss) return;

  const global = buildGlobalStats();

  for (const [userId, clients] of authenticatedClients) {
    let liveRanking;
    try {
      liveRanking = await buildLiveRanking(userId);
    } catch (err) {
      console.error(`Live ranking error for ${userId}:`, err);
      liveRanking = {};
    }

    const payload = JSON.stringify({
      type: "live_stats",
      timestamp: Date.now(),
      global,
      you: { liveRanking },
    });

    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}

/**
 * Push EOD summary to a specific user via WebSocket
 * Called from the EOD job after computing their summary
 */
function pushEODSummary(userId, summary) {
  const clients = authenticatedClients.get(userId);
  if (!clients) return;

  const payload = JSON.stringify({
    type: "eod_summary",
    timestamp: Date.now(),
    summary,
  });

  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

module.exports = { initWebSocket, broadcastUpdate, pushEODSummary };