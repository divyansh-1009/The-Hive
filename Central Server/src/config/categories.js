// config/categories.js

// 9 category codes
const CATEGORIES = {
  DEV: "DEV",         // Development
  CP: "CP",           // Competitive Programming
  DESIGN: "DESIGN",   // Design
  WRITING: "WRITING", // Writing & Org
  EDU: "EDU",         // Educational Content
  COMM: "COMM",       // Communication
  SOC: "SOC",         // Social Media
  ENT: "ENT",         // Entertainment
  UNCAT: "UNCAT",     // Uncategorized
};

// 4 persona roles
const PERSONA_ROLES = {
  CS: "CS",
  DESIGN: "DESIGN",
  BUSINESS: "BUSINESS",
  GENERAL: "GENERAL",
};

// Role-Based Category Weight Matrix
// Rows = categories, Columns = persona roles
const WEIGHT_MATRIX = {
  DEV:     { CS: 1.2, DESIGN: 0.2, BUSINESS: 0.0, GENERAL: 0.8 },
  CP:      { CS: 1.2, DESIGN: -0.2, BUSINESS: 0.0, GENERAL: 0.8 },
  DESIGN:  { CS: 0.2, DESIGN: 1.2, BUSINESS: 0.2, GENERAL: 0.8 },
  WRITING: { CS: 0.5, DESIGN: 0.5, BUSINESS: 1.2, GENERAL: 0.8 },
  EDU:     { CS: 1.0, DESIGN: 0.8, BUSINESS: 1.0, GENERAL: 0.8 },
  COMM:    { CS: 0.4, DESIGN: 0.4, BUSINESS: 1.0, GENERAL: 0.5 },
  SOC:     { CS: -0.6, DESIGN: -0.2, BUSINESS: -0.6, GENERAL: -0.6 },
  ENT:     { CS: -0.8, DESIGN: -0.8, BUSINESS: -0.8, GENERAL: -0.8 },
  UNCAT:   { CS: 0.0, DESIGN: 0.0, BUSINESS: 0.0, GENERAL: 0.0 },
};

/**
 * Get the weight for a category given a persona role
 */
function getWeight(category, personaRole) {
  const row = WEIGHT_MATRIX[category];
  if (!row) return 0;
  return row[personaRole] ?? row["GENERAL"] ?? 0;
}

/**
 * Get positive categories (w > 0) for a given persona role
 */
function getPositiveCategories(personaRole) {
  return Object.keys(WEIGHT_MATRIX).filter(
    (c) => getWeight(c, personaRole) > 0
  );
}

// Category labels for embedding fallback matching
const CATEGORY_LABELS = {
  DEV: "software development programming coding IDE terminal",
  CP: "competitive programming algorithm contest leetcode codeforces",
  DESIGN: "graphic design UI UX figma illustration creative",
  WRITING: "writing documentation organization notes planning",
  EDU: "education learning course tutorial lecture academic",
  COMM: "communication messaging email chat collaboration",
  SOC: "social media feed timeline posts sharing",
  ENT: "entertainment streaming video music gaming",
};

// Seed data — known apps/sites to pre-embed into the database
const SEED_MAPPINGS = [
  // DEV
  { name: "github.com", category: "DEV" },
  { name: "stackoverflow.com", category: "DEV" },
  { name: "gitlab.com", category: "DEV" },
  { name: "VS Code", category: "DEV" },
  { name: "code.exe", category: "DEV" },
  { name: "Android Studio", category: "DEV" },
  { name: "bitbucket.org", category: "DEV" },
  { name: "docker.com", category: "DEV" },
  { name: "npmjs.com", category: "DEV" },

  // CP
  { name: "leetcode.com", category: "CP" },
  { name: "codeforces.com", category: "CP" },
  { name: "codechef.com", category: "CP" },
  { name: "hackerrank.com", category: "CP" },
  { name: "atcoder.jp", category: "CP" },
  { name: "hackerearth.com", category: "CP" },

  // DESIGN
  { name: "figma.com", category: "DESIGN" },
  { name: "canva.com", category: "DESIGN" },
  { name: "dribbble.com", category: "DESIGN" },
  { name: "behance.net", category: "DESIGN" },
  { name: "Adobe Photoshop", category: "DESIGN" },
  { name: "Adobe Illustrator", category: "DESIGN" },

  // WRITING
  { name: "docs.google.com", category: "WRITING" },
  { name: "notion.so", category: "WRITING" },
  { name: "overleaf.com", category: "WRITING" },
  { name: "medium.com", category: "WRITING" },
  { name: "Microsoft Word", category: "WRITING" },
  { name: "Google Docs", category: "WRITING" },

  // EDU
  { name: "coursera.org", category: "EDU" },
  { name: "khanacademy.org", category: "EDU" },
  { name: "edx.org", category: "EDU" },
  { name: "udemy.com", category: "EDU" },
  { name: "scholar.google.com", category: "EDU" },

  // COMM
  { name: "slack.com", category: "COMM" },
  { name: "discord.com", category: "COMM" },
  { name: "teams.microsoft.com", category: "COMM" },
  { name: "zoom.us", category: "COMM" },
  { name: "Gmail", category: "COMM" },
  { name: "mail.google.com", category: "COMM" },

  // SOC
  { name: "instagram.com", category: "SOC" },
  { name: "twitter.com", category: "SOC" },
  { name: "x.com", category: "SOC" },
  { name: "facebook.com", category: "SOC" },
  { name: "reddit.com", category: "SOC" },
  { name: "Instagram", category: "SOC" },
  { name: "Twitter", category: "SOC" },
  { name: "tiktok.com", category: "SOC" },
  { name: "snapchat.com", category: "SOC" },

  // ENT
  { name: "youtube.com", category: "ENT" },
  { name: "netflix.com", category: "ENT" },
  { name: "twitch.tv", category: "ENT" },
  { name: "spotify.com", category: "ENT" },
  { name: "YouTube", category: "ENT" },
  { name: "Netflix", category: "ENT" },
  { name: "primevideo.com", category: "ENT" },
  { name: "disneyplus.com", category: "ENT" },
];

module.exports = {
  CATEGORIES,
  PERSONA_ROLES,
  WEIGHT_MATRIX,
  getWeight,
  getPositiveCategories,
  CATEGORY_LABELS,
  SEED_MAPPINGS,
};