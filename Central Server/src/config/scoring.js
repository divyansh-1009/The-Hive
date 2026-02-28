// config/scoring.js

module.exports = {
  // Bayesian skill model defaults
  INITIAL_MU: 25,          // µ₀ — starting skill estimate
  INITIAL_SIGMA: 8.33,     // σ₀ — starting uncertainty (≈25/3)
  SIGMA_OBS: 5,            // σ_obs — global daily performance noise

  // Streak
  T_MIN: 60,               // Minimum productive minutes per day for streak

  // Session management
  STALE_SESSION_THRESHOLD_MS: 30 * 60 * 1000, // 30 minutes — discard if no close

  // Tier percentile boundaries
  TIERS: {
    DIAMOND:  0.95,
    PLATINUM: 0.85,
    GOLD:     0.65,
    SILVER:   0.40,
    BRONZE:   0.00,
  },

  // EOD cron schedule (midnight)
  EOD_CRON: "0 0 * * *",
};