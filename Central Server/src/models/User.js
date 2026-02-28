// models/User.js

const db = require("../config/db");
const { INITIAL_MU, INITIAL_SIGMA } = require("../config/scoring");

const User = {
  async create(userId, email, passwordHash) {
    const res = await db.query(
      `INSERT INTO users (user_id, email, password_hash, mu, sigma, streak, tier)
       VALUES ($1, $2, $3, $4, $5, 0, 'BRONZE')
       RETURNING *`,
      [userId, email, passwordHash, INITIAL_MU, INITIAL_SIGMA]
    );
    return res.rows[0];
  },

  async findById(userId) {
    const res = await db.query(`SELECT * FROM users WHERE user_id = $1`, [userId]);
    return res.rows[0] || null;
  },

  async findByEmail(email) {
    const res = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
    return res.rows[0] || null;
  },

  async updateRating(userId, mu, sigma, displayRating, tier) {
    await db.query(
      `UPDATE users SET mu = $2, sigma = $3, display_rating = $4, tier = $5 WHERE user_id = $1`,
      [userId, mu, sigma, displayRating, tier]
    );
  },

  async updateStreak(userId, streak) {
    await db.query(`UPDATE users SET streak = $2 WHERE user_id = $1`, [userId, streak]);
  },

  async getAllIds() {
    const res = await db.query(`SELECT user_id FROM users`);
    return res.rows.map((r) => r.user_id);
  },

  async getAll() {
    const res = await db.query(`SELECT * FROM users ORDER BY display_rating DESC`);
    return res.rows;
  },
};

module.exports = User;