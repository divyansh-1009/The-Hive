// index.js

require("dotenv").config();
const express = require("express");
const http = require("http");
const cron = require("node-cron");
const cors = require("cors");

const routes = require("./routes");
const { runEndOfDay } = require("./controllers/rating");
const { initWebSocket } = require("./controllers/liveController");
const { EOD_CRON } = require("./config/scoring");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", routes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Initialize WebSocket for live stats
initWebSocket(server);

// Schedule EOD Bayesian update at midnight
cron.schedule(EOD_CRON, async () => {
  console.log("Running end-of-day scoring job...");
  try {
    await runEndOfDay();
  } catch (err) {
    console.error("EOD job failed:", err);
  }
});

// Use server.listen instead of app.listen so WebSocket shares the same port
server.listen(PORT, () => {
  console.log(`The Hive server running on port ${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws/live`);
});