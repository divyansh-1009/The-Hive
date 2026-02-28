// models/AppEmbedding.js

const db = require("../config/db");

const AppEmbedding = {
  /**
   * Insert an app/site with its embedding and category
   * source: 'seed', 'auto', 'manual', 'label'
   * Never overwrites 'seed' or 'manual' entries with 'auto'
   */
  async upsert(appOrSite, category, embedding, source) {
    const vecStr = `[${embedding.join(",")}]`;

    if (source === "auto") {
      // Only insert if not exists, or update if existing source is also 'auto'
      await db.query(
        `INSERT INTO app_embeddings (app_or_site, category, embedding, source)
         VALUES ($1, $2, $3::vector, $4)
         ON CONFLICT (app_or_site) DO UPDATE
           SET category = $2, embedding = $3::vector, source = $4
           WHERE app_embeddings.source = 'auto'`,
        [appOrSite, category, vecStr, source]
      );
    } else {
      // seed, manual, label — always overwrite
      await db.query(
        `INSERT INTO app_embeddings (app_or_site, category, embedding, source)
         VALUES ($1, $2, $3::vector, $4)
         ON CONFLICT (app_or_site)
         DO UPDATE SET category = $2, embedding = $3::vector, source = $4`,
        [appOrSite, category, vecStr, source]
      );
    }
  },

  /**
   * Look up category by exact app/site name
   * Returns { category, source } or null
   */
  async findByName(appOrSite) {
    const res = await db.query(
      `SELECT category, source FROM app_embeddings WHERE app_or_site = $1`,
      [appOrSite]
    );
    return res.rows[0] || null;
  },

  /**
   * Find the closest match by cosine similarity against all stored embeddings
   * Returns { app_or_site, category, similarity } or null
   */
  async findClosest(embedding) {
    const vecStr = `[${embedding.join(",")}]`;
    const res = await db.query(
      `SELECT app_or_site, category,
              1 - (embedding <=> $1::vector) AS similarity
       FROM app_embeddings
       ORDER BY embedding <=> $1::vector
       LIMIT 1`,
      [vecStr]
    );
    if (res.rows.length === 0) return null;
    return {
      app_or_site: res.rows[0].app_or_site,
      category: res.rows[0].category,
      similarity: parseFloat(res.rows[0].similarity),
    };
  },

  /**
   * Find closest match against category label embeddings only
   * These are stored with source = 'label'
   */
  async findClosestLabel(embedding) {
    const vecStr = `[${embedding.join(",")}]`;
    const res = await db.query(
      `SELECT app_or_site, category,
              1 - (embedding <=> $1::vector) AS similarity
       FROM app_embeddings
       WHERE source = 'label'
       ORDER BY embedding <=> $1::vector
       LIMIT 1`,
      [vecStr]
    );
    if (res.rows.length === 0) return null;
    return {
      category: res.rows[0].category,
      similarity: parseFloat(res.rows[0].similarity),
    };
  },

  /**
   * Check if seed data has been loaded
   */
  async seedExists() {
    const res = await db.query(
      `SELECT COUNT(*) FROM app_embeddings WHERE source = 'seed'`
    );
    return parseInt(res.rows[0].count) > 0;
  },
};

module.exports = AppEmbedding;
