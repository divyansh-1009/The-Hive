const db = require('../config/db');

const UsageReport = {
  async createTable() {
    await db.query(`
      CREATE TABLE IF NOT EXISTS usage_reports (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_id   VARCHAR(255) NOT NULL,
        date        DATE NOT NULL,
        apps        JSONB NOT NULL,
        created_at  TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, device_id, date)
      );
    `);
  },

  async upsert({ userId, deviceId, date, apps }) {
    const { rows } = await db.query(
      `INSERT INTO usage_reports (user_id, device_id, date, apps)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, device_id, date)
       DO UPDATE SET apps = $4, created_at = NOW()
       RETURNING id, user_id, device_id, date, created_at`,
      [userId, deviceId, date, JSON.stringify(apps)],
    );
    return rows[0];
  },
};

module.exports = UsageReport;
