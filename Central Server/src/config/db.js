// config/db.js

const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "the_hive",
  user: process.env.DB_USER || "divyansh",
  password: process.env.DB_PASSWORD || "",
  allowExitOnIdle: false,
  keepAlive: true,
});

pool.on("error", (err) => {
  console.error("Unexpected pool error:", err);
});

module.exports = pool;