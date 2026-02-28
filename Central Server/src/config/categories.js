// config/categories.js

// Category weights as defined in the paper
const CATEGORY_WEIGHTS = {
  CP: 1.2,    // Competitive Programming
  DEV: 1.0,   // Development Tools
  EDU: 0.8,   // Educational Content
  SOC: -0.6,  // Social Media
  ENT: -0.8,  // Entertainment Streaming
};

// Positive-weight categories (C⁺) for streak calculation
const POSITIVE_CATEGORIES = Object.keys(CATEGORY_WEIGHTS).filter(
  (c) => CATEGORY_WEIGHTS[c] > 0
);

// Placeholder mapping — will be replaced by vector embeddings later
// Maps known site/app names to categories
const KNOWN_MAPPINGS = {
  // CP
  "leetcode.com": "CP",
  "codeforces.com": "CP",
  "codechef.com": "CP",
  "hackerrank.com": "CP",
  "atcoder.jp": "CP",

  // DEV
  "github.com": "DEV",
  "stackoverflow.com": "DEV",
  "gitlab.com": "DEV",
  "VS Code": "DEV",
  "code.exe": "DEV",
  "Android Studio": "DEV",

  // EDU
  "coursera.org": "EDU",
  "khanacademy.org": "EDU",
  "edx.org": "EDU",
  "udemy.com": "EDU",
  "scholar.google.com": "EDU",

  // SOC
  "instagram.com": "SOC",
  "twitter.com": "SOC",
  "x.com": "SOC",
  "facebook.com": "SOC",
  "reddit.com": "SOC",
  "Instagram": "SOC",
  "Twitter": "SOC",

  // ENT
  "youtube.com": "ENT",
  "netflix.com": "ENT",
  "twitch.tv": "ENT",
  "spotify.com": "ENT",
  "YouTube": "ENT",
  "Netflix": "ENT",
};

function getCategory(appOrSite) {
  return KNOWN_MAPPINGS[appOrSite] || null;
}

module.exports = {
  CATEGORY_WEIGHTS,
  POSITIVE_CATEGORIES,
  KNOWN_MAPPINGS,
  getCategory,
};
