// models/Activity.js

const db = require("../config/db");

const Activity = {
  // Upsert daily category time — adds duration to existing total
  async addCategoryTime(userId, date, category, durationMinutes) {
    await db.query(
      `INSERT INTO daily_activity (user_id, date, category, total_minutes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, date, category)
       DO UPDATE SET total_minutes = daily_activity.total_minutes + $4`,
      [userId, date, category, durationMinutes]
    );
  },

  // Get all category totals for a user on a given day
  async getDailyTotals(userId, date) {
    const res = await db.query(
      `SELECT category, total_minutes FROM daily_activity
       WHERE user_id = $1 AND date = $2`,
      [userId, date]
    );
    // Return as { CP: 95, DEV: 140, ... }
    const totals = {};
    for (const row of res.rows) {
      totals[row.category] = parseFloat(row.total_minutes);
    }
    return totals;
  },

  // Get all users who have activity on a given date
  async getActiveUserIds(date) {
    const res = await db.query(
      `SELECT DISTINCT user_id FROM daily_activity WHERE date = $1`,
      [date]
    );
    return res.rows.map((r) => r.user_id);
  },

  // Get all users' scores for a specific category on a date (for percentile calc)
  async getCategoryScores(date, category) {
    const res = await db.query(
      `SELECT user_id, total_minutes FROM daily_activity
       WHERE date = $1 AND category = $2
       ORDER BY total_minutes ASC`,
      [date, category]
    );
    return res.rows;
  },
};

module.exports = Activity;