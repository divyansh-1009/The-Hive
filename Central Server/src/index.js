// index.js

require("dotenv").config();
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

// Start server and seed embeddings
async function start() {
  // Seed embeddings on first run (loads model + embeds known apps)
  // This takes ~30-60 seconds on first run as it downloads the model
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