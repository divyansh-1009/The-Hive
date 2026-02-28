// config/scoring.js

module.exports = {
  // Bayesian skill model defaults
  INITIAL_MU: 12,
  INITIAL_SIGMA: 6,
  SIGMA_OBS: 5,

  // Streak
  T_MIN: 60, // minutes of positive-weight activity needed per day

  // Minimum session duration (seconds) — Chrome sessions shorter than this are discarded
  MIN_SESSION_SECONDS: 60,

  // Idle detection
  IDLE_DETECTION_SECONDS: 300, // 5 minutes — extension uses chrome.idle API

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
  EMBEDDING_DIMENSION: 384,
};