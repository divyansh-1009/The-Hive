-- schema.sql
-- Full database schema for The Hive
-- Run: psql -U postgres -d thehive -f schema.sql

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
    user_id        UUID PRIMARY KEY,
    email          VARCHAR(255) UNIQUE NOT NULL,
    password_hash  TEXT NOT NULL,
    persona_role   VARCHAR(20) NOT NULL DEFAULT 'GENERAL',
    mu             DOUBLE PRECISION NOT NULL DEFAULT 25.0,
    sigma          DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    display_rating DOUBLE PRECISION NOT NULL DEFAULT 8.34,
    tier           VARCHAR(20) NOT NULL DEFAULT 'BRONZE',
    streak         INTEGER NOT NULL DEFAULT 0,
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_rating ON users(display_rating DESC);
CREATE INDEX idx_users_persona ON users(persona_role);

-- ============================================================
-- 2. DEVICES
-- ============================================================
CREATE TABLE devices (
    device_id   VARCHAR(255) PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    device_type VARCHAR(20) NOT NULL,
    linked_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_devices_user ON devices(user_id);

-- ============================================================
-- 3. EXTENSION_EVENTS (raw audit log)
-- ============================================================
CREATE TABLE extension_events (
    id          SERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    device_id   VARCHAR(255) NOT NULL,
    site        VARCHAR(512) NOT NULL,
    state       VARCHAR(10) NOT NULL CHECK (state IN ('active', 'closed')),
    timestamp   BIGINT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ext_events_user ON extension_events(user_id, timestamp);

-- ============================================================
-- 4. USAGE_REPORTS (raw audit log)
-- ============================================================
CREATE TABLE usage_reports (
    id          SERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    device_id   VARCHAR(255) NOT NULL,
    date        DATE NOT NULL,
    apps        JSONB NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, device_id, date)
);

-- ============================================================
-- 5. DAILY_ACTIVITY
-- ============================================================
CREATE TABLE daily_activity (
    user_id       UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    date          DATE NOT NULL,
    category      VARCHAR(10) NOT NULL,
    total_minutes DOUBLE PRECISION NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, date, category)
);

CREATE INDEX idx_daily_activity_date ON daily_activity(date);
CREATE INDEX idx_daily_activity_user_date ON daily_activity(user_id, date);

-- ============================================================
-- 6. APP_EMBEDDINGS
-- ============================================================
CREATE TABLE app_embeddings (
    app_or_site VARCHAR(255) PRIMARY KEY,
    category    VARCHAR(10) NOT NULL,
    embedding   vector(384) NOT NULL,
    source      VARCHAR(20) NOT NULL DEFAULT 'seed',
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_embeddings_vector ON app_embeddings
    USING hnsw (embedding vector_cosine_ops);

-- ============================================================
-- 7. UNCATEGORIZED_QUEUE
-- ============================================================
CREATE TABLE uncategorized_queue (
    app_or_site VARCHAR(255) PRIMARY KEY,
    source      VARCHAR(20) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);