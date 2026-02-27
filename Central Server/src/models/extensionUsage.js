const db = require('../config/db');

const ExtensionUsage = {
  async createTable() {
    await db.query(`
      CREATE TABLE IF NOT EXISTS extension_events (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_id   VARCHAR(255) NOT NULL,
        site        VARCHAR(512) NOT NULL,
        state       VARCHAR(10) NOT NULL CHECK (state IN ('active', 'closed')),
        timestamp   BIGINT NOT NULL,
        created_at  TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_ext_events_user
      ON extension_events (user_id, timestamp);
    `);
  },

  async insertEvent({ userId, deviceId, site, state, timestamp }) {
    const { rows } = await db.query(
      `INSERT INTO extension_events (user_id, device_id, site, state, timestamp)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, deviceId, site, state, timestamp],
    );
    return rows[0];
  },
};

module.exports = ExtensionUsage;
