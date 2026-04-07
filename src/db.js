// src/db.js
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
  ssl: "require",
  max: 10,
});

export default sql;

/**
 * Run database migrations — creates all tables if they don't exist.
 * Safe to run on every server start.
 */
export async function runMigrations() {
  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      google_id   TEXT UNIQUE NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      name        TEXT,
      avatar_url  TEXT,
      plan        TEXT NOT NULL DEFAULT 'free',
      is_admin    BOOLEAN NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS api_keys (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name         TEXT NOT NULL,
      key          TEXT UNIQUE NOT NULL,
      is_active    BOOLEAN NOT NULL DEFAULT true,
      expires_at   TIMESTAMPTZ,
      last_used_at TIMESTAMPTZ,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash  TEXT UNIQUE NOT NULL,
      expires_at  TIMESTAMPTZ NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS usage_logs (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      api_key_id     UUID REFERENCES api_keys(id) ON DELETE SET NULL,
      user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
      source_type    TEXT NOT NULL,
      final_decision TEXT NOT NULL,
      layer          TEXT NOT NULL,
      google_ms      INT NOT NULL DEFAULT 0,
      claude_ms      INT NOT NULL DEFAULT 0,
      total_ms       INT NOT NULL DEFAULT 0,
      file_size      INT NOT NULL DEFAULT 0,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key_id ON usage_logs(api_key_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key)`;

  console.log("DB migrations complete");
}

// Allow running directly: node src/db.js
if (process.argv[1].endsWith("db.js")) {
  await runMigrations();
  await sql.end();
}
