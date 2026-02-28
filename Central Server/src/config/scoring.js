// config/scoring.js

module.exports = {
  // Bayesian skill model defaults
  INITIAL_MU: 25,
  INITIAL_SIGMA: 8.33,
  SIGMA_OBS: 5,

  // Streak
  T_MIN: 60, // minutes of positive-weight activity needed per day

  // Idle detection
  IDLE_DETECTION_SECONDS: 300, // 5 minutes — extension uses chrome.idle API
  // Extension checks every 30s and sends idleState with each event

  // Tier percentile boundaries
  TIERS: {
    DIAMOND: 0.95,
    PLATINUM: 0.85,
    GOLD: 0.65,
    SILVER: 0.40,
    BRONZE: 0.00,
  },

  // EOD cron schedule (midnight)
  EOD_CRON: "0 0 * * *",

  // Embedding similarity threshold
  SIMILARITY_THRESHOLD: 0.5,

  // Embedding model
  EMBEDDING_MODEL: "Xenova/bge-small-en-v1.5",
  EMBEDDING_DIMENSION: 384, // output dimension of bge-small-en-v1.5
};