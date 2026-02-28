// index.js

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const http = require("http");
const cron = require("node-cron");
const cors = require("cors");

const routes = require("./routes");
const { runEndOfDay } = require("./controllers/rating");
const { initWebSocket } = require("./controllers/liveController");
const { seedEmbeddings } = require("./controllers/embeddingController");
const { EOD_CRON } = require("./config/scoring");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// --- Global error handlers ---
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", routes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Global Express error handler
app.use((err, _req, res, _next) => {
  console.error("Express error:", err);
  res.status(500).json({ error: "Internal server error" });
});

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

// Start server and seed embeddings
async function start() {
  try {
    await seedEmbeddings();
  } catch (err) {
    console.error("Failed to seed embeddings:", err);
    console.log("Server will start but embedding-based categorization may not work.");
  }

  server.listen(PORT, () => {
    console.log(`The Hive server running on port ${PORT}`);
    console.log(`WebSocket available at ws://localhost:${PORT}/ws/live`);
  });
}

start();