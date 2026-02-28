// models/UncategorizedQueue.js

const db = require("../config/db");

const UncategorizedQueue = {
  async add(appOrSite, source) {
    await db.query(
      `INSERT INTO uncategorized_queue (app_or_site, source, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (app_or_site) DO NOTHING`,
      [appOrSite, source]
    );
  },

  async getAll() {
    const res = await db.query(
      `SELECT * FROM uncategorized_queue ORDER BY created_at DESC`
    );
    return res.rows;
  },

  async remove(appOrSite) {
    await db.query(`DELETE FROM uncategorized_queue WHERE app_or_site = $1`, [appOrSite]);
  },
};

module.exports = UncategorizedQueue;