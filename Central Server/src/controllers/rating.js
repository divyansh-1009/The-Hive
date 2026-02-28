// controllers/rating.js

const User = require("../models/User");
const Activity = require("../models/Activity");
const { computeUserDailyScore, computeLogScaled } = require("./scoring");
const { SIGMA_OBS, T_MIN, TIERS } = require("../config/scoring");
const { CATEGORIES, getWeight } = require("../config/categories");
const { pushEODSummary } = require("./liveController");

/**
 * Bayesian update for a user's skill estimate
 *
 * µ' = (σ_obs² · µ + σ_i² · X_i) / (σ_obs² + σ_i²)
 * σ'² = (σ_obs² · σ_i²) / (σ_obs² + σ_i²)
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
 */
function getTier(percentile) {
  if (percentile >= TIERS.DIAMOND) return "DIAMOND";
  if (percentile >= TIERS.PLATINUM) return "PLATINUM";
  if (percentile >= TIERS.GOLD) return "GOLD";
  if (percentile >= TIERS.SILVER) return "SILVER";
  return "BRONZE";
}

function getPreviousDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

/**
 * Compute EOD summary for a single user
 * Top 3 categories by time, with both overall and within-persona percentiles
 */
async function computeEODSummary(userId, date, personaRole) {
  const totals = await Activity.getDailyTotals(userId, date);

  if (Object.keys(totals).length === 0) return null;

  // Sort categories by time spent, take top 3
  const sorted = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const summaryCategories = [];

  for (const [category, minutes] of sorted) {
    // --- Overall percentile (all users) ---
    const allScores = await Activity.getCategoryScores(date, category);
    const allValues = allScores.map((r) => parseFloat(r.total_minutes));
    const overallCount = allValues.filter((v) => v <= minutes).length;
    const overallPercentile = allValues.length > 0
      ? (overallCount / allValues.length) * 100
      : 0;

    // --- Within-persona percentile ---
    const personaScores = await Activity.getCategoryScoresByPersona(date, category, personaRole);
    const personaValues = personaScores.map((r) => parseFloat(r.total_minutes));
    const personaCount = personaValues.filter((v) => v <= minutes).length;
    const personaPercentile = personaValues.length > 0
      ? (personaCount / personaValues.length) * 100
      : 0;

    summaryCategories.push({
      category,
      minutes: Math.round(minutes * 10) / 10,
      overall: {
        percentile: Math.round(overallPercentile * 100) / 100,
        rank: allValues.length - overallCount + 1,
        totalUsers: allValues.length,
      },
      withinPersona: {
        percentile: Math.round(personaPercentile * 100) / 100,
        rank: personaValues.length - personaCount + 1,
        totalUsers: personaValues.length,
        persona: personaRole,
      },
    });
  }

  return {
    date,
    personaRole,
    topCategories: summaryCategories,
  };
}

/**
 * End-of-day job: runs at midnight via cron
 * 1. Compute daily scores
 * 2. Bayesian update
 * 3. Assign tiers
 * 4. Update streaks
 * 5. Compute and push EOD summaries
 */
async function runEndOfDay() {
  const date = getPreviousDate();
  const activeUserIds = await Activity.getActiveUserIds(date);

  if (activeUserIds.length === 0) {
    console.log(`EOD: No active users on ${date}`);
    return;
  }

  // Step 1 & 2: Compute scores and Bayesian update
  const userScores = [];

  for (const userId of activeUserIds) {
    const user = await User.findById(userId);
    if (!user) continue;

    const { weightedScore, streakMet, personaRole } = await computeUserDailyScore(userId, date, T_MIN);

    const { mu: newMu, sigma: newSigma } = bayesianUpdate(
      user.mu,
      user.sigma,
      weightedScore
    );
    const rating = displayRating(newMu, newSigma);

    userScores.push({
      userId,
      newMu,
      newSigma,
      rating,
      streakMet,
      currentStreak: user.streak,
      personaRole,
    });
  }

  // Step 3: Sort by display rating for percentile computation
  userScores.sort((a, b) => a.rating - b.rating);
  const totalUsers = userScores.length;

  // Step 4: Assign tiers and update streaks
  for (let idx = 0; idx < userScores.length; idx++) {
    const u = userScores[idx];
    const percentile = (idx + 1) / totalUsers;
    const tier = getTier(percentile);

    await User.updateRating(u.userId, u.newMu, u.newSigma, u.rating, tier);

    const newStreak = u.streakMet ? u.currentStreak + 1 : 0;
    await User.updateStreak(u.userId, newStreak);
  }

  // Step 5: Compute and push EOD summaries via WebSocket
  for (const u of userScores) {
    try {
      const summary = await computeEODSummary(u.userId, date, u.personaRole);
      if (summary) {
        // Add rating info to the summary
        summary.rating = {
          mu: Math.round(u.newMu * 100) / 100,
          sigma: Math.round(u.newSigma * 100) / 100,
          displayRating: Math.round(u.rating * 100) / 100,
          tier: getTier((userScores.indexOf(u) + 1) / totalUsers),
          streak: u.streakMet ? u.currentStreak + 1 : 0,
        };
        pushEODSummary(u.userId, summary);
      }
    } catch (err) {
      console.error(`EOD summary error for ${u.userId}:`, err);
    }
  }

  console.log(`EOD complete for ${date}: ${totalUsers} users updated`);
}

// GET /api/rating
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
      personaRole: user.persona_role,
    });
  } catch (err) {
    console.error("Rating error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/leaderboard
async function getLeaderboard(req, res) {
  try {
    const users = await User.getAll();
    const leaderboard = users.map((u, idx) => ({
      rank: idx + 1,
      displayRating: u.display_rating,
      tier: u.tier,
      streak: u.streak,
    }));
    return res.status(200).json(leaderboard);
  } catch (err) {
    console.error("Leaderboard error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/ranking/domain
async function getDomainRankings(req, res) {
  try {
    const userId = req.userId;
    const today = new Date().toISOString().split("T")[0];

    const userTotals = await Activity.getDailyTotals(userId, today);
    if (Object.keys(userTotals).length === 0) {
      return res.status(200).json({ message: "No activity today", rankings: {} });
    }

    const userLogScaled = computeLogScaled(userTotals);
    const rankings = {};

    for (const category of Object.keys(userLogScaled)) {
      const allScores = await Activity.getCategoryScores(today, category);
      const nc = allScores.length;
      if (nc === 0) {
        rankings[category] = { percentile: 0, rank: 0, totalUsers: 0 };
        continue;
      }

      const allLogValues = allScores.map((r) => Math.log(1 + parseFloat(r.total_minutes)));
      const userValue = userLogScaled[category];
      const countBelow = allLogValues.filter((v) => v <= userValue).length;
      const percentile = countBelow / nc;
      const rank = nc - countBelow + 1;

      rankings[category] = {
        percentile: Math.round(percentile * 10000) / 100,
        rank,
        totalUsers: nc,
        logScore: Math.round(userValue * 1000) / 1000,
      };
    }

    return res.status(200).json({ date: today, rankings });
  } catch (err) {
    console.error("Domain ranking error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/summary/:date — fetch EOD summary for a past date
async function getEODSummary(req, res) {
  try {
    const userId = req.userId;
    const { date } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const summary = await computeEODSummary(userId, date, user.persona_role);
    if (!summary) {
      return res.status(200).json({ message: "No activity on this date" });
    }

    summary.rating = {
      mu: user.mu,
      sigma: user.sigma,
      displayRating: user.display_rating,
      tier: user.tier,
      streak: user.streak,
    };

    return res.status(200).json(summary);
  } catch (err) {
    console.error("EOD summary error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  bayesianUpdate,
  displayRating,
  getTier,
  runEndOfDay,
  getRating,
  getLeaderboard,
  getDomainRankings,
  getEODSummary,
};