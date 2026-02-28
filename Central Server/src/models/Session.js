// models/Session.js
// In-memory store for active sessions (one per device)
// This avoids DB overhead for high-frequency open/close events

const activeSessions = new Map();

const Session = {
  get(deviceId) {
    return activeSessions.get(deviceId) || null;
  },

  set(deviceId, sessionData) {
    // sessionData: { userId, site, timestamp }
    activeSessions.set(deviceId, sessionData);
  },

  remove(deviceId) {
    activeSessions.delete(deviceId);
  },

  getAll() {
    return activeSessions;
  },
};

module.exports = Session;