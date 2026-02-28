// models/Device.js

const db = require("../config/db");

const Device = {
  async link(deviceId, userId, deviceType) {
    const res = await db.query(
      `INSERT INTO devices (device_id, user_id, device_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (device_id) DO UPDATE SET user_id = $2
       RETURNING *`,
      [deviceId, userId, deviceType]
    );
    return res.rows[0];
  },

  async getUserId(deviceId) {
    const res = await db.query(
      `SELECT user_id FROM devices WHERE device_id = $1`,
      [deviceId]
    );
    return res.rows[0]?.user_id || null;
  },
};

module.exports = Device;