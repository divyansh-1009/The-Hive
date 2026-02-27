const { Pool } = require('pg');
const config = require('./index');

const pool = new Pool(config.db);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
