// controllers/scoring.js

const Activity = require("../models/Activity");
const User = require("../models/User");
const { getWeight, getPositiveCategories } = require("../config/categories");

/**
 * Compute X(i,c) = ln(1 + A(i,c)) for each category
 * @param {Object} totals - { CP: 95, DEV: 140, ... } in minutes
 * @returns {Object} logScaled - { CP: ln(96), DEV: ln(141), ... }
 */
function computeLogScaled(totals) {
  const logScaled = {};
  for (const [category, minutes] of Object.entries(totals)) {
    logScaled[category] = Math.log(1 + minutes);
  }
  return logScaled;
}

/**
 * Compute weighted daily score: X(i) = Σ w(c, role) · X(i,c)
 * Now persona-aware — uses the weight matrix column for the user's role
 * @param {Object} logScaled - { CP: 4.56, DEV: 4.95, ... }
 * @param {string} personaRole - 'CS', 'DESIGN', 'BUSINESS', 'GENERAL'
 * @returns {number} weighted score
 */
function computeWeightedScore(logScaled, personaRole) {
  let score = 0;
  for (const [category, value] of Object.entries(logScaled)) {
    score += getWeight(category, personaRole) * value;
  }
  return score;
}

/**
 * Check streak condition: Σ A(i,c) >= T_min for c ∈ C⁺(role)
 * Positive categories depend on the user's persona role
 * @param {Object} totals - { CP: 95, DEV: 140, ... }
 * @param {number} tMin - minimum productive minutes
 * @param {string} personaRole
 * @returns {boolean}
 */
function checkStreakCondition(totals, tMin, personaRole) {
  const positiveCategories = getPositiveCategories(personaRole);
  let productiveMinutes = 0;
  for (const category of positiveCategories) {
    productiveMinutes += totals[category] || 0;
  }
  return productiveMinutes >= tMin;
}

/**
 * Full scoring pipeline for a user on a given date
 * Returns { totals, logScaled, weightedScore, streakMet }
 */
async function computeUserDailyScore(userId, date, tMin) {
  const user = await User.findById(userId);
  const personaRole = user?.persona_role || "GENERAL";

  const totals = await Activity.getDailyTotals(userId, date);
  const logScaled = computeLogScaled(totals);
  const weightedScore = computeWeightedScore(logScaled, personaRole);
  const streakMet = checkStreakCondition(totals, tMin, personaRole);

  return { totals, logScaled, weightedScore, streakMet, personaRole };
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