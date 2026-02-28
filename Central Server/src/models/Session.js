// models/Session.js
// In-memory store for active sessions (one per device)

const activeSessions = new Map();

const Session = {
  get(deviceId) {
    return activeSessions.get(deviceId) || null;
  },

  /**
   * sessionData: {
   *   userId, site, timestamp,
   *   idleState: "ACTIVE" | "IDLE" | "LOCKED",
   *   accumulatedMs: time banked before idle pauses
   * }
   */
  set(deviceId, sessionData) {
    activeSessions.set(deviceId, {
      idleState: "ACTIVE",
      accumulatedMs: 0,
      ...sessionData,
    });
  },

  remove(deviceId) {
    activeSessions.delete(deviceId);
  },

  getAll() {
    return activeSessions;
  },
};

module.exports = Session;