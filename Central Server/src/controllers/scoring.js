// controllers/scoringController.js

const Activity = require("../models/Activity");
const { CATEGORY_WEIGHTS, POSITIVE_CATEGORIES } = require("../config/categories");

/**
 * Compute X(i,c) = ln(1 + A(i,c)) for each category
 * @param {Object} totals - { CP: 95, DEV: 140, ... } in minutes
 * @returns {Object} logScaled - { CP: ln(96), DEV: ln(141), ... }
 */
function computeLogScaled(totals) {
  const logScaled = {};
  for (const [category, minutes] of Object.entries(totals)) {
    logScaled[category] = Math.log(1 + minutes); // natural log
  }
  return logScaled;
}

/**
 * Compute weighted daily score: X(i) = Σ w(c) · X(i,c)
 * @param {Object} logScaled - { CP: 4.56, DEV: 4.95, ... }
 * @returns {number} weighted score
 */
function computeWeightedScore(logScaled) {
  let score = 0;
  for (const [category, value] of Object.entries(logScaled)) {
    const weight = CATEGORY_WEIGHTS[category];
    if (weight !== undefined) {
      score += weight * value;
    }
  }
  return score;
}

/**
 * Check streak condition: Σ A(i,c) >= T_min for c ∈ C⁺
 * @param {Object} totals - { CP: 95, DEV: 140, ... }
 * @param {number} tMin - minimum productive minutes
 * @returns {boolean}
 */
function checkStreakCondition(totals, tMin) {
  let productiveMinutes = 0;
  for (const category of POSITIVE_CATEGORIES) {
    productiveMinutes += totals[category] || 0;
  }
  return productiveMinutes >= tMin;
}

/**
 * Full scoring pipeline for a user on a given date
 * Returns { totals, logScaled, weightedScore, streakMet }
 */
async function computeUserDailyScore(userId, date, tMin) {
  const totals = await Activity.getDailyTotals(userId, date);
  const logScaled = computeLogScaled(totals);
  const weightedScore = computeWeightedScore(logScaled);
  const streakMet = checkStreakCondition(totals, tMin);

  return { totals, logScaled, weightedScore, streakMet };
}

// GET /api/score — returns current day's score for the authenticated user
async function getScore(req, res) {
  try {
    const userId = req.userId;
    const today = new Date().toISOString().split("T")[0];
    const result = await computeUserDailyScore(userId, today, 60);

    return res.status(200).json(result);
  } catch (err) {
    console.error("Score error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  computeLogScaled,
  computeWeightedScore,
  checkStreakCondition,
  computeUserDailyScore,
  getScore,
};