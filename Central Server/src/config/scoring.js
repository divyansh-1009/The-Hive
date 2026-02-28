// config/scoring.js

module.exports = {
  // Bayesian skill model defaults
  INITIAL_MU: 25,
  INITIAL_SIGMA: 8.33,
  SIGMA_OBS: 5,

  // Streak
  T_MIN: 60, // minutes of positive-weight activity needed per day

  // Session management
  STALE_SESSION_THRESHOLD_MS: 30 * 60 * 1000, // 30 minutes

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
  EMBEDDING_MODEL: "Xenova/all-MiniLM-L6-v2",
  EMBEDDING_DIMENSION: 384, // output dimension of all-MiniLM-L6-v2
};