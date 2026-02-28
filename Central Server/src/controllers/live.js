// controllers/liveController.js

const WebSocket = require("ws");
const Session = require("../models/Session");
const { getCategory } = require("../config/categories");

let wss = null;

/**
 * Initialize WebSocket server attached to the HTTP server
 */
function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: "/ws/live" });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    // Send current snapshot immediately on connect
    ws.send(JSON.stringify(buildSnapshot()));

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });

  console.log("WebSocket live stats available at /ws/live");
}

/**
 * Build a snapshot of current live stats from active sessions
 */
function buildSnapshot() {
  const sessions = Session.getAll();
  const totalActive = sessions.size;

  // Count users per category
  const categoryBreakdown = {};
  const activeSites = {};

  for (const [deviceId, session] of sessions) {
    const category = getCategory(session.site) || "UNKNOWN";

    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;

    // Track site popularity (anonymous — just counts)
    activeSites[session.site] = (activeSites[session.site] || 0) + 1;
  }

  // Top 5 most active sites right now
  const topSites = Object.entries(activeSites)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([site, count]) => ({ site, count }));

  return {
    type: "live_stats",
    timestamp: Date.now(),
    totalActive,
    categoryBreakdown,
    topSites,
  };
}

/**
 * Broadcast updated stats to all connected WebSocket clients
 * Call this whenever a session changes (open, close, implicit close)
 */
function broadcastUpdate() {
  if (!wss) return;

  const snapshot = buildSnapshot();
  const payload = JSON.stringify(snapshot);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

module.exports = { initWebSocket, broadcastUpdate };