const { Pool } = require('pg');
const config = require('./index');

const pool = new Pool({
  ...config.db,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: false,       // keep the process alive even when pool is idle
  keepAlive: true,              // enable TCP keep-alive on connections
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error (non-fatal):', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
