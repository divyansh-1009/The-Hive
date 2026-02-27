const express = require('express');
const config = require('./config');
const db = require('./config/db');
const User = require('./models/user');
const UsageReport = require('./models/usageReport');
const authRoutes = require('./routes/auth');
const mobileUsageRoutes = require('./routes/mobileUsage');

const app = express();

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/mobile/usage', mobileUsageRoutes);

// ── Start ────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await db.query('SELECT 1');
    console.log('Connected to PostgreSQL.');

    await User.createTable();
    await UsageReport.createTable();
    console.log('Database tables ready.');

    app.listen(config.port, () => {
      console.log(`Central Server listening on port ${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();

module.exports = app;
