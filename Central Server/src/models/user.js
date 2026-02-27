const db = require('../config/db');

const User = {
  async createTable() {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        email       VARCHAR(255) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        name        VARCHAR(255) NOT NULL,
        created_at  TIMESTAMP DEFAULT NOW()
      );
    `);
  },

  async findByEmail(email) {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    return rows[0] || null;
  },

  async create({ email, password, name }) {
    const { rows } = await db.query(
      `INSERT INTO users (email, password, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [email, password, name],
    );
    return rows[0];
  },
};

module.exports = User;
