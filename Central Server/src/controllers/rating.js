// controllers/ratingController.js

const User = require("../models/User");
const Activity = require("../models/Activity");
const { computeUserDailyScore } = require("./scoringController");
const { SIGMA_OBS, T_MIN, TIERS } = require("../config/scoring");
const { CATEGORY_WEIGHTS } = require("../config/categories");

/**
 * Bayesian update for a user's skill estimate
 *
 * µ' = (σ_obs² · µ + σ_i² · X_i) / (σ_obs² + σ_i²)
 * σ'² = (σ_obs² · σ_i²) / (σ_obs² + σ_i²)
 *
 * @param {number} mu - current skill estimate
 * @param {number} sigma - current uncertainty
 * @param {number} dailyScore - X_i (today's weighted score)
 * @returns {{ mu: number, sigma: number }}
 */
function bayesianUpdate(mu, sigma, dailyScore) {
  const sigmaObsSq = SIGMA_OBS * SIGMA_OBS;
  const sigmaSq = sigma * sigma;

  const newMu = (sigmaObsSq * mu + sigmaSq * dailyScore) / (sigmaObsSq + sigmaSq);
  const newSigmaSq = (sigmaObsSq * sigmaSq) / (sigmaObsSq + sigmaSq);
  const newSigma = Math.sqrt(newSigmaSq);

  return { mu: newMu, sigma: newSigma };
}

/**
 * Conservative display rating: R = µ - 2σ
 */
function displayRating(mu, sigma) {
  return mu - 2 * sigma;
}

/**
 * Determine tier from percentile
 * @param {number} percentile - 0 to 1
 * @returns {string} tier name
 */
function getTier(percentile) {
  if (percentile >= TIERS.DIAMOND) return "DIAMOND";
  if (percentile >= TIERS.PLATINUM) return "PLATINUM";
  if (percentile >= TIERS.GOLD) return "GOLD";
  if (percentile >= TIERS.SILVER) return "SILVER";
  return "BRONZE";
}

/**
 * Compute empirical percentile for a value in a sorted array
 * P(i,c) = |{ j | X(j,c) <= X(i,c) }| / N_c
 */
function computePercentile(value, sortedValues) {
  const n = sortedValues.length;
  if (n === 0) return 0;
  let count = 0;
  for (const v of sortedValues) {
    if (v <= value) count++;
    else break; // sorted, so we can break
  }
  return count / n;
}

/**
 * End-of-day job: runs at midnight via cron
 * 1. For each active user, compute daily score
 * 2. Bayesian update µ and σ
 * 3. Compute display rating
 * 4. Assign percentile-based tiers
 * 5. Update streaks
 */
async function runEndOfDay() {
  const date = getPreviousDate(); // score yesterday's activity
  const activeUserIds = await Activity.getActiveUserIds(date);

  if (activeUserIds.length === 0) {
    console.log(`EOD: No active users on ${date}`);
    return;
  }

  // Step 1 & 2: Compute scores and update Bayesian ratings
  const userScores = [];

  for (const userId of activeUserIds) {
    const user = await User.findById(userId);
    if (!user) continue;

    const { weightedScore, streakMet } = await computeUserDailyScore(userId, date, T_MIN);

    // Bayesian update
    const { mu: newMu, sigma: newSigma } = bayesianUpdate(
      user.mu,
      user.sigma,
      weightedScore
    );
    const rating = displayRating(newMu, newSigma);

    userScores.push({ userId, newMu, newSigma, rating, streakMet, currentStreak: user.streak });
  }

  // Step 3: Sort by display rating to compute percentiles
  userScores.sort((a, b) => a.rating - b.rating);
  const allRatings = userScores.map((u) => u.rating);
  const totalUsers = allRatings.length;

  // Step 4 & 5: Assign tiers and update streaks
  for (let idx = 0; idx < userScores.length; idx++) {
    const u = userScores[idx];
    const percentile = (idx + 1) / totalUsers;
    const tier = getTier(percentile);

    // Update rating and tier
    await User.updateRating(u.userId, u.newMu, u.newSigma, u.rating, tier);

    // Update streak
    const newStreak = u.streakMet ? u.currentStreak + 1 : 0;
    await User.updateStreak(u.userId, newStreak);
  }

  console.log(`EOD complete for ${date}: ${totalUsers} users updated`);
}

/**
 * Returns yesterday's date string (YYYY-MM-DD)
 */
function getPreviousDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// GET /api/rating — returns authenticated user's rating info
async function getRating(req, res) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({
      mu: user.mu,
      sigma: user.sigma,
      displayRating: user.display_rating,
      tier: user.tier,
      streak: user.streak,
    });
  } catch (err) {
    console.error("Rating error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/leaderboard — anonymous leaderboard
async function getLeaderboard(req, res) {
  try {
    const users = await User.getAll();
    const leaderboard = users.map((u, idx) => ({
      rank: idx + 1,
      displayRating: u.display_rating,
      tier: u.tier,
      streak: u.streak,
      // Anonymous — no email or userId exposed
    }));
    return res.status(200).json(leaderboard);
  } catch (err) {
    console.error("Leaderboard error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  bayesianUpdate,
  displayRating,
  getTier,
  computePercentile,
  runEndOfDay,
  getRating,
  getLeaderboard,
};