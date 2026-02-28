// controllers/embeddingController.js

const AppEmbedding = require("../models/AppEmbedding");
const UncategorizedQueue = require("../models/UncategorizedQueue");
const { SEED_MAPPINGS, CATEGORY_LABELS } = require("../config/categories");
const { SIMILARITY_THRESHOLD, EMBEDDING_MODEL } = require("../config/scoring");

let embedder = null;
let pipelineFunc = null;

/**
 * Dynamically import @xenova/transformers (ESM module)
 */
async function loadPipeline() {
  if (!pipelineFunc) {
    const module = await import("@xenova/transformers");
    pipelineFunc = module.pipeline;
  }
  return pipelineFunc;
}

/**
 * Initialize the embedding model (lazy load, called once)
 */
async function getEmbedder() {
  if (!embedder) {
    console.log(`Loading embedding model: ${EMBEDDING_MODEL}...`);
    const pipe = await loadPipeline();
    embedder = await pipe("feature-extraction", EMBEDDING_MODEL);
    console.log("Embedding model loaded.");
  }
  return embedder;
}

/**
 * Generate embedding for a given text string
 * Returns Array of length 384
 */
async function generateEmbedding(text) {
  const model = await getEmbedder();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

/**
 * Seed the database with embeddings for known apps and category labels
 * Run once on server startup if not already seeded
 */
async function seedEmbeddings() {
  const alreadySeeded = await AppEmbedding.seedExists();
  if (alreadySeeded) {
    console.log("Seed embeddings already exist, skipping.");
    return;
  }

  console.log("Seeding app embeddings...");

  // Seed known apps/sites
  for (const { name, category } of SEED_MAPPINGS) {
    const embedding = await generateEmbedding(name);
    await AppEmbedding.upsert(name, category, embedding, "seed");
  }
  console.log(`Seeded ${SEED_MAPPINGS.length} known apps/sites.`);

  // Seed category labels (for fallback matching)
  for (const [category, label] of Object.entries(CATEGORY_LABELS)) {
    const embedding = await generateEmbedding(label);
    await AppEmbedding.upsert(`__label__${category}`, category, embedding, "label");
  }
  console.log(`Seeded ${Object.keys(CATEGORY_LABELS).length} category labels.`);
}

/**
 * Categorize an unknown app/site using the two-tier matching pipeline:
 * 1. Cosine similarity against known apps (seed + auto)
 * 2. Fallback: cosine similarity against category labels
 * 3. If both below threshold → stays uncategorized, queued
 *
 * @param {string} appOrSite
 * @param {string} source - 'chrome' or 'mobile'
 * @returns {{ category: string|null, similarity: number, method: string }}
 */
async function categorize(appOrSite, source) {
  // Step 0: Check if already in DB (exact match)
  const existing = await AppEmbedding.findByName(appOrSite);
  if (existing && existing.source !== "label") {
    return { category: existing.category, similarity: 1.0, method: "exact" };
  }

  // Step 1: Generate embedding for the unknown app
  const embedding = await generateEmbedding(appOrSite);

  // Step 2: Match against known apps
  const knownMatch = await AppEmbedding.findClosest(embedding);
  if (knownMatch && knownMatch.similarity >= SIMILARITY_THRESHOLD) {
    // Auto-categorize and store for future exact matches
    await AppEmbedding.upsert(appOrSite, knownMatch.category, embedding, "auto");
    return {
      category: knownMatch.category,
      similarity: knownMatch.similarity,
      method: "known_match",
    };
  }

  // Step 3: Fallback — match against category labels
  const labelMatch = await AppEmbedding.findClosestLabel(embedding);
  if (labelMatch && labelMatch.similarity >= SIMILARITY_THRESHOLD) {
    await AppEmbedding.upsert(appOrSite, labelMatch.category, embedding, "auto");
    return {
      category: labelMatch.category,
      similarity: labelMatch.similarity,
      method: "label_match",
    };
  }

  // Step 4: Below threshold — queue for manual review
  await AppEmbedding.upsert(appOrSite, "UNCAT", embedding, "auto");
  await UncategorizedQueue.add(appOrSite, source);

  return {
    category: null,
    similarity: Math.max(
      knownMatch?.similarity || 0,
      labelMatch?.similarity || 0
    ),
    method: "below_threshold",
  };
}

module.exports = { generateEmbedding, seedEmbeddings, categorize, getEmbedder };