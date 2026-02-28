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
const WEIGHT_MATRIX = {
  DEV:     { CS: 1.2, DESIGN: 0.3, BUSINESS: 0.1, GENERAL: 0.8 },
  CP:      { CS: 1.2, DESIGN: 0.0, BUSINESS: 0.0, GENERAL: 0.6 },
  DESIGN:  { CS: 0.2, DESIGN: 1.2, BUSINESS: 0.4, GENERAL: 0.6 },
  WRITING: { CS: 0.4, DESIGN: 0.6, BUSINESS: 1.2, GENERAL: 0.6 },
  EDU:     { CS: 1.0, DESIGN: 0.8, BUSINESS: 1.0, GENERAL: 0.6 },
  COMM:    { CS: 0.3, DESIGN: 0.3, BUSINESS: 1.0, GENERAL: 0.4 },
  SOC:     { CS: -0.6, DESIGN: -0.2, BUSINESS: -0.4, GENERAL: -0.4},
  ENT:     { CS: -0.8, DESIGN: -0.8, BUSINESS: -0.8, GENERAL: -0.6},
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
// Max 15 per category, optimized for exact-match coverage + embedding diversity
const SEED_MAPPINGS = [
  // ── DEV (15) ───────────────────────────────────
  { name: "github.com", category: "DEV" },
  { name: "stackoverflow.com", category: "DEV" },
  { name: "gitlab.com", category: "DEV" },
  { name: "bitbucket.org", category: "DEV" },
  { name: "VS Code", category: "DEV" },
  { name: "code.exe", category: "DEV" },
  { name: "Android Studio", category: "DEV" },
  { name: "IntelliJ IDEA", category: "DEV" },
  { name: "docker.com", category: "DEV" },
  { name: "npmjs.com", category: "DEV" },
  { name: "replit.com", category: "DEV" },
  { name: "vercel.com", category: "DEV" },
  { name: "postman.com", category: "DEV" },
  { name: "codepen.io", category: "DEV" },
  { name: "dev.to", category: "DEV" },

  // ── CP (15) ────────────────────────────────────
  { name: "leetcode.com", category: "CP" },
  { name: "codeforces.com", category: "CP" },
  { name: "codechef.com", category: "CP" },
  { name: "hackerrank.com", category: "CP" },
  { name: "atcoder.jp", category: "CP" },
  { name: "hackerearth.com", category: "CP" },
  { name: "spoj.com", category: "CP" },
  { name: "cses.fi", category: "CP" },
  { name: "projecteuler.net", category: "CP" },
  { name: "kattis.com", category: "CP" },
  { name: "usaco.org", category: "CP" },
  { name: "binarysearch.com", category: "CP" },
  { name: "naukri.com/code360", category: "CP" },
  { name: "interviewbit.com", category: "CP" },
  { name: "topcoder.com", category: "CP" },

  // ── DESIGN (15) ────────────────────────────────
  { name: "figma.com", category: "DESIGN" },
  { name: "canva.com", category: "DESIGN" },
  { name: "dribbble.com", category: "DESIGN" },
  { name: "behance.net", category: "DESIGN" },
  { name: "Adobe Photoshop", category: "DESIGN" },
  { name: "Adobe Illustrator", category: "DESIGN" },
  { name: "Adobe XD", category: "DESIGN" },
  { name: "Sketch", category: "DESIGN" },
  { name: "framer.com", category: "DESIGN" },
  { name: "invisionapp.com", category: "DESIGN" },
  { name: "coolors.co", category: "DESIGN" },
  { name: "unsplash.com", category: "DESIGN" },
  { name: "Blender", category: "DESIGN" },
  { name: "penpot.app", category: "DESIGN" },
  { name: "removebg.com", category: "DESIGN" },

  // ── WRITING (15) ───────────────────────────────
  { name: "docs.google.com", category: "WRITING" },
  { name: "notion.so", category: "WRITING" },
  { name: "overleaf.com", category: "WRITING" },
  { name: "medium.com", category: "WRITING" },
  { name: "Microsoft Word", category: "WRITING" },
  { name: "Google Slides", category: "WRITING" },
  { name: "slides.google.com", category: "WRITING" },
  { name: "Microsoft PowerPoint", category: "WRITING" },
  { name: "Obsidian", category: "WRITING" },
  { name: "evernote.com", category: "WRITING" },
  { name: "grammarly.com", category: "WRITING" },
  { name: "trello.com", category: "WRITING" },
  { name: "confluence.atlassian.com", category: "WRITING" },
  { name: "hemingwayapp.com", category: "WRITING" },
  { name: "substack.com", category: "WRITING" },

  // ── EDU (15) ───────────────────────────────────
  { name: "coursera.org", category: "EDU" },
  { name: "khanacademy.org", category: "EDU" },
  { name: "edx.org", category: "EDU" },
  { name: "udemy.com", category: "EDU" },
  { name: "scholar.google.com", category: "EDU" },
  { name: "geeksforgeeks.org", category: "EDU" },
  { name: "w3schools.com", category: "EDU" },
  { name: "freecodecamp.org", category: "EDU" },
  { name: "brilliant.org", category: "EDU" },
  { name: "nptel.ac.in", category: "EDU" },
  { name: "ocw.mit.edu", category: "EDU" },
  { name: "wikipedia.org", category: "EDU" },
  { name: "arxiv.org", category: "EDU" },
  { name: "codecademy.com", category: "EDU" },
  { name: "researchgate.net", category: "EDU" },

  // ── COMM (15) ──────────────────────────────────
  { name: "slack.com", category: "COMM" },
  { name: "discord.com", category: "COMM" },
  { name: "teams.microsoft.com", category: "COMM" },
  { name: "zoom.us", category: "COMM" },
  { name: "mail.google.com", category: "COMM" },
  { name: "meet.google.com", category: "COMM" },
  { name: "outlook.com", category: "COMM" },
  { name: "linkedin.com", category: "COMM" },
  { name: "LinkedIn", category: "COMM" },
  { name: "Telegram", category: "COMM" },
  { name: "web.telegram.org", category: "COMM" },
  { name: "Slack", category: "COMM" },
  { name: "Discord", category: "COMM" },
  { name: "Zoom", category: "COMM" },
  { name: "Microsoft Teams", category: "COMM" },

  // ── SOC (15) ───────────────────────────────────
  { name: "instagram.com", category: "SOC" },
  { name: "twitter.com", category: "SOC" },
  { name: "x.com", category: "SOC" },
  { name: "facebook.com", category: "SOC" },
  { name: "reddit.com", category: "SOC" },
  { name: "Instagram", category: "SOC" },
  { name: "Twitter", category: "SOC" },
  { name: "tiktok.com", category: "SOC" },
  { name: "snapchat.com", category: "SOC" },
  { name: "Snapchat", category: "SOC" },
  { name: "threads.net", category: "SOC" },
  { name: "quora.com", category: "SOC" },
  { name: "tumblr.com", category: "SOC" },
  { name: "pinterest.com", category: "SOC" },
  { name: "Pinterest", category: "SOC" },

  // ── ENT (15) ───────────────────────────────────
  { name: "youtube.com", category: "ENT" },
  { name: "netflix.com", category: "ENT" },
  { name: "twitch.tv", category: "ENT" },
  { name: "spotify.com", category: "ENT" },
  { name: "primevideo.com", category: "ENT" },
  { name: "hotstar.com", category: "ENT" },
  { name: "jiocinema.com", category: "ENT" },
  { name: "crunchyroll.com", category: "ENT" },
  { name: "music.youtube.com", category: "ENT" },
  { name: "store.steampowered.com", category: "ENT" },
  { name: "Steam", category: "ENT" },
  { name: "epicgames.com", category: "ENT" },
  { name: "Valorant", category: "ENT" },
  { name: "Minecraft", category: "ENT" },
  { name: "Roblox", category: "ENT" },
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