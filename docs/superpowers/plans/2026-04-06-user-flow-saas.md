# SaaS User Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add production-ready SaaS layer: Google OAuth, PostgreSQL-backed API key management, per-key rate limiting, usage analytics, React dashboard with playground, and admin panel — all in one Express + React monorepo.

**Architecture:** Single Express server serves both the REST API and the compiled React SPA. Google OAuth issues short-lived JWT access tokens + long-lived refresh tokens stored hashed in Neon PostgreSQL. The existing moderation engine (`orchestrator.js`, `google-vision.js`, etc.) is untouched — only `api-key-middleware.js` and `index.js` are modified.

**Tech Stack:** Node.js ESM, Express, Passport.js (Google OAuth), JWT, Neon PostgreSQL (`postgres` npm), Redis (sliding window rate limit), React 18, Vite, TailwindCSS, TanStack Query v5, Recharts, React Router v6

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | Add backend deps + new scripts |
| `.env.example` | Modify | Add Google OAuth, JWT, DB vars |
| `src/db.js` | Create | Neon DB connection + run migrations |
| `src/middleware/auth-jwt.js` | Create | Verify JWT access token from cookie |
| `src/middleware/rate-limiter.js` | Create | Redis sliding window per API key |
| `src/services/usage-logger.js` | Create | Fire-and-forget moderation call logging |
| `src/routes/auth.js` | Create | Google OAuth + JWT issue/refresh/logout |
| `src/routes/keys.js` | Create | API key CRUD for developer |
| `src/routes/stats.js` | Create | Developer usage stats |
| `src/routes/admin.js` | Create | Admin-only user/key/platform management |
| `src/api-key-middleware.js` | Modify | Read keys from DB instead of .env |
| `src/index.js` | Modify | Mount all routes + serve React static |
| `client/package.json` | Create | React app dependencies |
| `client/index.html` | Create | Vite HTML entry point |
| `client/vite.config.js` | Create | Proxy /api, /auth to Express in dev |
| `client/tailwind.config.js` | Create | Tailwind config |
| `client/postcss.config.js` | Create | PostCSS for Tailwind |
| `client/src/main.jsx` | Create | React root mount |
| `client/src/App.jsx` | Create | Router + auth guard + QueryClient |
| `client/src/lib/api.js` | Create | Fetch wrapper with auto token refresh |
| `client/src/pages/Login.jsx` | Create | Google sign-in page |
| `client/src/pages/Dashboard.jsx` | Create | Key management page |
| `client/src/components/KeyCard.jsx` | Create | Single key row component |
| `client/src/pages/Playground.jsx` | Create | Live moderation test tool |
| `client/src/components/VerdictBadge.jsx` | Create | allow/flag/block colored badge |
| `client/src/components/ScoreBar.jsx` | Create | Visual score bar (0-1) |
| `client/src/pages/Stats.jsx` | Create | Usage charts page |
| `client/src/components/UsageChart.jsx` | Create | Recharts line + donut |
| `client/src/pages/Admin.jsx` | Create | Admin panel page |

---

## Task 1: Install Backend Dependencies + Update Config Files

**Files:**
- Modify: `package.json`
- Modify: `.env.example`

- [ ] **Step 1: Install new backend dependencies**

```bash
cd /Users/sushilsahani/devsushil/mod-me
npm install passport passport-google-oauth20 jsonwebtoken cookie-parser postgres cors
```

Expected: packages added with no errors.

- [ ] **Step 2: Update package.json scripts**

Open `package.json` and replace the `scripts` section with:

```json
"scripts": {
  "start": "node src/index.js",
  "dev": "nodemon src/index.js",
  "dev:client": "cd client && npm run dev",
  "build:client": "cd client && npm run build",
  "db:migrate": "node src/db.js",
  "test:image": "node tests/test-image.js",
  "test:gif": "node tests/test-gif.js",
  "test:video": "node tests/test-video.js",
  "generate-key": "node scripts/generate-key.js",
  "generate-key:save": "node scripts/generate-key.js --save"
}
```

- [ ] **Step 3: Append new vars to .env.example**

Add these lines to the end of `.env.example`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT
JWT_SECRET=your-random-secret-minimum-32-characters
COOKIE_SECRET=your-random-cookie-secret-minimum-32-chars

# Neon PostgreSQL
DATABASE_URL=postgresql://user:pass@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# App URLs
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "feat: install backend deps for SaaS layer"
```

---

## Task 2: src/db.js — Neon PostgreSQL Connection + Migrations

**Files:**
- Create: `src/db.js`

- [ ] **Step 1: Create src/db.js**

```javascript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/db.js
git commit -m "feat: add Neon DB connection and migrations"
```

---

## Task 3: src/middleware/auth-jwt.js — JWT Verification Middleware

**Files:**
- Create: `src/middleware/auth-jwt.js`

- [ ] **Step 1: Create src/middleware/auth-jwt.js**

```javascript
// src/middleware/auth-jwt.js
import jwt from "jsonwebtoken";

/**
 * Verifies the JWT access_token cookie.
 * On success, attaches req.user = { userId, email, isAdmin }.
 * On failure, returns 401.
 */
export function requireJwt(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId:  payload.userId,
      email:   payload.email,
      isAdmin: payload.isAdmin,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Session expired" });
  }
}

/**
 * After requireJwt: rejects if user is not an admin.
 */
export function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware/auth-jwt.js
git commit -m "feat: add JWT auth middleware"
```

---

## Task 4: src/routes/auth.js — Google OAuth + JWT Issue/Refresh/Logout

**Files:**
- Create: `src/routes/auth.js`

- [ ] **Step 1: Create src/routes/auth.js**

```javascript
// src/routes/auth.js
import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sql from "../db.js";

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

const ACCESS_TOKEN_TTL  = 15 * 60;          // 15 minutes in seconds
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

// ── Passport setup ──────────────────────────────────────────────────────────

passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email     = profile.emails?.[0]?.value;
      const name      = profile.displayName;
      const avatarUrl = profile.photos?.[0]?.value;

      // Upsert user — update name/avatar on each login
      const [user] = await sql`
        INSERT INTO users (google_id, email, name, avatar_url)
        VALUES (${profile.id}, ${email}, ${name}, ${avatarUrl})
        ON CONFLICT (google_id) DO UPDATE
          SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
        RETURNING id, email, name, avatar_url, plan, is_admin
      `;
      done(null, user);
    } catch (err) {
      done(err);
    }
  }
));

// Passport requires serialize/deserialize even if we don't use sessions
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ── Helpers ─────────────────────────────────────────────────────────────────

function issueTokens(res, user) {
  // Access token — short lived JWT
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, isAdmin: user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );

  // Refresh token — random opaque string, store hash in DB
  const rawRefresh  = crypto.randomBytes(40).toString("hex");
  const tokenHash   = crypto.createHash("sha256").update(rawRefresh).digest("hex");
  const expiresAt   = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000);

  // Store hash (fire-and-forget — don't await to keep response fast)
  sql`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${tokenHash}, ${expiresAt})
  `.catch(console.error);

  res.cookie("access_token",  accessToken, { ...COOKIE_OPTS, maxAge: ACCESS_TOKEN_TTL * 1000 });
  res.cookie("refresh_token", rawRefresh,  { ...COOKIE_OPTS, maxAge: REFRESH_TOKEN_TTL * 1000 });
}

// ── Routes ───────────────────────────────────────────────────────────────────

router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login?error=oauth" }),
  (req, res) => {
    issueTokens(res, req.user);
    res.redirect("/dashboard");
  }
);

router.post("/refresh", async (req, res) => {
  const rawRefresh = req.cookies?.refresh_token;
  if (!rawRefresh) return res.status(401).json({ error: "No refresh token" });

  const tokenHash = crypto.createHash("sha256").update(rawRefresh).digest("hex");

  const [stored] = await sql`
    SELECT rt.user_id, rt.expires_at, u.email, u.is_admin
    FROM refresh_tokens rt
    JOIN users u ON u.id = rt.user_id
    WHERE rt.token_hash = ${tokenHash}
  `;

  if (!stored || new Date(stored.expires_at) < new Date()) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }

  const accessToken = jwt.sign(
    { userId: stored.user_id, email: stored.email, isAdmin: stored.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );

  res.cookie("access_token", accessToken, { ...COOKIE_OPTS, maxAge: ACCESS_TOKEN_TTL * 1000 });
  res.json({ ok: true });
});

router.post("/logout", async (req, res) => {
  const rawRefresh = req.cookies?.refresh_token;
  if (rawRefresh) {
    const tokenHash = crypto.createHash("sha256").update(rawRefresh).digest("hex");
    await sql`DELETE FROM refresh_tokens WHERE token_hash = ${tokenHash}`;
  }
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.json({ ok: true });
});

export { router as authRouter, passport };
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/auth.js
git commit -m "feat: add Google OAuth + JWT auth routes"
```

---

## Task 5: src/middleware/rate-limiter.js — Redis Sliding Window

**Files:**
- Create: `src/middleware/rate-limiter.js`

- [ ] **Step 1: Create src/middleware/rate-limiter.js**

```javascript
// src/middleware/rate-limiter.js
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
});

const WINDOW_SECONDS = 60 * 60; // 1 hour

const PLAN_LIMITS = {
  free: 100,
  pro:  1000,
};

/**
 * Redis sliding window rate limiter.
 * Requires req.apiKey = { id, userId, plan } (set by api-key-middleware).
 * Sets X-RateLimit-* headers and returns 429 if limit exceeded.
 */
export async function rateLimiter(req, res, next) {
  const { id: keyId, plan } = req.apiKey;
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const redisKey = `rl:${keyId}`;
  const now = Date.now();
  const windowStart = now - WINDOW_SECONDS * 1000;

  // Sliding window using Redis sorted set
  // Score = timestamp ms, member = unique request id
  const multi = redis.multi();
  multi.zremrangebyscore(redisKey, "-inf", windowStart);        // remove old entries
  multi.zadd(redisKey, now, `${now}-${Math.random()}`);         // add current request
  multi.zcard(redisKey);                                         // count in window
  multi.expire(redisKey, WINDOW_SECONDS);                        // auto-expire key

  const results = await multi.exec();
  const count = results[2][1]; // zcard result

  const resetAt = Math.ceil((now + WINDOW_SECONDS * 1000) / 1000);

  res.setHeader("X-RateLimit-Limit",     limit);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - count));
  res.setHeader("X-RateLimit-Reset",     resetAt);

  if (count > limit) {
    res.setHeader("Retry-After", WINDOW_SECONDS);
    return res.status(429).json({
      error: "Rate limit exceeded",
      retryAfter: WINDOW_SECONDS,
      limit,
      plan,
    });
  }

  next();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware/rate-limiter.js
git commit -m "feat: add Redis sliding window rate limiter"
```

---

## Task 6: src/services/usage-logger.js — Fire-and-Forget Usage Logging

**Files:**
- Create: `src/services/usage-logger.js`

- [ ] **Step 1: Create src/services/usage-logger.js**

```javascript
// src/services/usage-logger.js
import sql from "../db.js";
import { logger } from "../utils.js";

/**
 * Log a completed moderation call to the usage_logs table.
 * Fire-and-forget — call without await so it never blocks the response.
 *
 * @param {Object} params
 * @param {string} params.apiKeyId
 * @param {string} params.userId
 * @param {Object} params.result    - the moderation result from orchestrator
 * @param {number} params.fileSize  - bytes
 */
export function logUsage({ apiKeyId, userId, result, fileSize }) {
  sql`
    INSERT INTO usage_logs
      (api_key_id, user_id, source_type, final_decision, layer, google_ms, claude_ms, total_ms, file_size)
    VALUES
      (${apiKeyId}, ${userId}, ${result.sourceType}, ${result.finalDecision},
       ${result.layer}, ${result.performance.googleMs}, ${result.performance.claudeMs},
       ${result.performance.totalMs}, ${fileSize})
  `.catch((err) => logger.error("Failed to log usage", { error: err.message }));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/usage-logger.js
git commit -m "feat: add usage logger service"
```

---

## Task 7: Modify src/api-key-middleware.js — Read Keys from DB

**Files:**
- Modify: `src/api-key-middleware.js`

- [ ] **Step 1: Replace src/api-key-middleware.js entirely**

```javascript
// src/api-key-middleware.js
import sql from "./db.js";

/**
 * Validates the API key from Authorization: Bearer <key> header.
 * Looks up key in the database (not .env).
 * On success: attaches req.apiKey = { id, userId, plan } and continues.
 * On failure: returns 401.
 */
export async function requireApiKey(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const key = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!key) {
    return res.status(401).json({ error: "Missing API key. Use Authorization: Bearer <key>" });
  }

  const [row] = await sql`
    SELECT ak.id, ak.user_id, ak.expires_at, u.plan
    FROM api_keys ak
    JOIN users u ON u.id = ak.user_id
    WHERE ak.key = ${key} AND ak.is_active = true
  `;

  if (!row) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return res.status(401).json({ error: "API key has expired" });
  }

  // Update last_used_at (fire-and-forget)
  sql`UPDATE api_keys SET last_used_at = now() WHERE id = ${row.id}`.catch(() => {});

  req.apiKey = { id: row.id, userId: row.user_id, plan: row.plan };
  next();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api-key-middleware.js
git commit -m "feat: api-key-middleware now validates against DB"
```

---

## Task 8: src/routes/keys.js — API Key CRUD

**Files:**
- Create: `src/routes/keys.js`

- [ ] **Step 1: Create src/routes/keys.js**

```javascript
// src/routes/keys.js
import express from "express";
import sql from "../db.js";
import { generateApiKey } from "../key-generator.js";

const router = express.Router();

// GET /api/keys — list all keys for the logged-in developer
router.get("/", async (req, res) => {
  const keys = await sql`
    SELECT id, name, key, is_active, expires_at, last_used_at, created_at
    FROM api_keys
    WHERE user_id = ${req.user.userId}
    ORDER BY created_at DESC
  `;
  res.json(keys);
});

// POST /api/keys — create a new key
router.post("/", async (req, res) => {
  const { name, expiresAt } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: "Key name is required" });
  }

  const key = generateApiKey();

  const [created] = await sql`
    INSERT INTO api_keys (user_id, name, key, expires_at)
    VALUES (${req.user.userId}, ${name.trim()}, ${key}, ${expiresAt || null})
    RETURNING id, name, key, is_active, expires_at, last_used_at, created_at
  `;
  res.status(201).json(created);
});

// PATCH /api/keys/:id — rename a key
router.patch("/:id", async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: "Key name is required" });
  }

  const [updated] = await sql`
    UPDATE api_keys
    SET name = ${name.trim()}
    WHERE id = ${req.params.id} AND user_id = ${req.user.userId}
    RETURNING id, name, key, is_active, expires_at, last_used_at, created_at
  `;

  if (!updated) return res.status(404).json({ error: "Key not found" });
  res.json(updated);
});

// DELETE /api/keys/:id — revoke a key (soft delete)
router.delete("/:id", async (req, res) => {
  const [revoked] = await sql`
    UPDATE api_keys
    SET is_active = false
    WHERE id = ${req.params.id} AND user_id = ${req.user.userId}
    RETURNING id
  `;

  if (!revoked) return res.status(404).json({ error: "Key not found" });
  res.json({ ok: true });
});

export { router as keysRouter };
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/keys.js
git commit -m "feat: add API key CRUD routes"
```

---

## Task 9: src/routes/stats.js — Developer Usage Stats

**Files:**
- Create: `src/routes/stats.js`

- [ ] **Step 1: Create src/routes/stats.js**

```javascript
// src/routes/stats.js
import express from "express";
import sql from "../db.js";

const router = express.Router();

// GET /api/stats — usage stats for last 30 days
router.get("/", async (req, res) => {
  const userId = req.user.userId;

  // Requests per day for the last 30 days
  const daily = await sql`
    SELECT
      DATE(created_at) AS date,
      COUNT(*)::int    AS count
    FROM usage_logs
    WHERE user_id = ${userId}
      AND created_at >= now() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date
  `;

  // Decision breakdown (all time)
  const decisions = await sql`
    SELECT final_decision, COUNT(*)::int AS count
    FROM usage_logs
    WHERE user_id = ${userId}
    GROUP BY final_decision
  `;

  // Summary stats
  const [summary] = await sql`
    SELECT
      COUNT(*)::int                       AS total_requests,
      ROUND(AVG(total_ms))::int           AS avg_latency_ms,
      COUNT(*) FILTER (WHERE final_decision = 'block')::int AS total_blocked,
      COUNT(*) FILTER (WHERE final_decision = 'flag')::int  AS total_flagged,
      COUNT(*) FILTER (WHERE final_decision = 'allow')::int AS total_allowed
    FROM usage_logs
    WHERE user_id = ${userId}
  `;

  // Most active key
  const [topKey] = await sql`
    SELECT ak.name, COUNT(ul.id)::int AS call_count
    FROM usage_logs ul
    JOIN api_keys ak ON ak.id = ul.api_key_id
    WHERE ul.user_id = ${userId}
    GROUP BY ak.name
    ORDER BY call_count DESC
    LIMIT 1
  `;

  res.json({
    daily,
    decisions,
    summary,
    topKey: topKey || null,
  });
});

export { router as statsRouter };
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/stats.js
git commit -m "feat: add developer stats routes"
```

---

## Task 10: src/routes/admin.js — Admin Panel Endpoints

**Files:**
- Create: `src/routes/admin.js`

- [ ] **Step 1: Create src/routes/admin.js**

```javascript
// src/routes/admin.js
import express from "express";
import sql from "../db.js";

const router = express.Router();

// GET /api/admin/stats — platform-wide stats
router.get("/stats", async (_req, res) => {
  const [stats] = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM users)                              AS total_users,
      (SELECT COUNT(*)::int FROM api_keys WHERE is_active = true)   AS total_active_keys,
      (SELECT COUNT(*)::int FROM usage_logs)                         AS total_requests,
      (SELECT COUNT(*)::int FROM usage_logs WHERE final_decision = 'block') AS total_blocked,
      (SELECT COUNT(*)::int FROM usage_logs WHERE final_decision = 'flag')  AS total_flagged,
      (SELECT COUNT(*)::int FROM usage_logs WHERE final_decision = 'allow') AS total_allowed
  `;
  res.json(stats);
});

// GET /api/admin/users — all users
router.get("/users", async (_req, res) => {
  const users = await sql`
    SELECT
      u.id, u.email, u.name, u.avatar_url, u.plan, u.is_admin, u.created_at,
      COUNT(DISTINCT ak.id)::int  AS key_count,
      COUNT(DISTINCT ul.id)::int  AS total_calls
    FROM users u
    LEFT JOIN api_keys   ak ON ak.user_id = u.id
    LEFT JOIN usage_logs ul ON ul.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;
  res.json(users);
});

// PATCH /api/admin/users/:id — change plan or toggle admin
router.patch("/users/:id", async (req, res) => {
  const { plan, isAdmin } = req.body;
  const updates = [];
  if (plan !== undefined)    updates.push(sql`plan = ${plan}`);
  if (isAdmin !== undefined) updates.push(sql`is_admin = ${isAdmin}`);
  if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });

  const [user] = await sql`
    UPDATE users SET ${sql(updates.join(", "))}
    WHERE id = ${req.params.id}
    RETURNING id, email, plan, is_admin
  `.catch(() => [null]);

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// GET /api/admin/keys — all active API keys
router.get("/keys", async (_req, res) => {
  const keys = await sql`
    SELECT
      ak.id, ak.name, ak.key, ak.is_active, ak.created_at, ak.last_used_at, ak.expires_at,
      u.email AS owner_email,
      COUNT(ul.id)::int AS call_count
    FROM api_keys ak
    JOIN users u ON u.id = ak.user_id
    LEFT JOIN usage_logs ul ON ul.api_key_id = ak.id
    GROUP BY ak.id, u.email
    ORDER BY ak.created_at DESC
  `;
  res.json(keys);
});

// DELETE /api/admin/keys/:id — force-revoke any key
router.delete("/keys/:id", async (req, res) => {
  const [revoked] = await sql`
    UPDATE api_keys SET is_active = false
    WHERE id = ${req.params.id}
    RETURNING id
  `;
  if (!revoked) return res.status(404).json({ error: "Key not found" });
  res.json({ ok: true });
});

export { router as adminRouter };
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/admin.js
git commit -m "feat: add admin routes"
```

---

## Task 11: Modify src/index.js — Mount All Routes + Serve React

**Files:**
- Modify: `src/index.js`

- [ ] **Step 1: Replace src/index.js entirely**

```javascript
// src/index.js
import "dotenv/config";
import express from "express";
import multer from "multer";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { runModeration } from "./orchestrator.js";
import { requireApiKey } from "./api-key-middleware.js";
import { requireJwt, requireAdmin } from "./middleware/auth-jwt.js";
import { rateLimiter } from "./middleware/rate-limiter.js";
import { logUsage } from "./services/usage-logger.js";
import { authRouter, passport } from "./routes/auth.js";
import { keysRouter } from "./routes/keys.js";
import { statsRouter } from "./routes/stats.js";
import { adminRouter } from "./routes/admin.js";
import { runMigrations } from "./db.js";
import { logger } from "./utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || "3000");

// ── Core middleware ──────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());
app.use(passport.initialize());

// ── Auth routes (no JWT required) ────────────────────────────────────────────
app.use("/auth", authRouter);

// ── Health (no auth) ─────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

// ── Developer API (JWT cookie required) ──────────────────────────────────────
app.get("/api/me", requireJwt, async (req, res) => {
  const [user] = await (await import("./db.js")).default`
    SELECT id, email, name, avatar_url, plan, is_admin, created_at
    FROM users WHERE id = ${req.user.userId}
  `;
  res.json(user);
});
app.use("/api/keys",  requireJwt, keysRouter);
app.use("/api/stats", requireJwt, statsRouter);

// ── Admin API (JWT + is_admin) ────────────────────────────────────────────────
app.use("/api/admin", requireJwt, requireAdmin, adminRouter);

// ── Moderation endpoint (API key + rate limit + usage log) ───────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime",
]);

app.post("/moderate", requireApiKey, rateLimiter, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded. Use multipart/form-data with field name 'file'." });
  }
  if (!ALLOWED_TYPES.has(req.file.mimetype)) {
    return res.status(415).json({ error: `Unsupported file type: ${req.file.mimetype}`, supported: [...ALLOWED_TYPES] });
  }

  try {
    const result = await runModeration(req.file.buffer, req.file.mimetype, {
      uploadId: req.headers["x-upload-id"],
      userId:   req.apiKey.userId,
      filename: req.file.originalname,
    });

    // Fire-and-forget usage log
    logUsage({
      apiKeyId: req.apiKey.id,
      userId:   req.apiKey.userId,
      result,
      fileSize: req.file.size,
    });

    const statusCode = result.finalDecision === "allow" ? 200 : 422;
    return res.status(statusCode).json(result);
  } catch (err) {
    logger.error("Fatal moderation error", { error: err.message });
    return res.status(500).json({ error: "Moderation service error", detail: err.message });
  }
});

// ── Serve React SPA in production ────────────────────────────────────────────
const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

// ── Start ─────────────────────────────────────────────────────────────────────
await runMigrations();
app.listen(PORT, () => {
  logger.info("Moderation service running", { port: PORT });
});
```

- [ ] **Step 2: Commit**

```bash
git add src/index.js
git commit -m "feat: mount SaaS routes, rate limiter, usage logger in Express"
```

---

## Task 12: client/ — React + Vite + Tailwind Scaffold

**Files:**
- Create: `client/package.json`
- Create: `client/index.html`
- Create: `client/vite.config.js`
- Create: `client/tailwind.config.js`
- Create: `client/postcss.config.js`
- Create: `client/src/main.jsx`
- Create: `client/src/index.css`

- [ ] **Step 1: Create client/package.json**

```json
{
  "name": "mod-me-client",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "@tanstack/react-query": "^5.40.0",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.1"
  }
}
```

- [ ] **Step 2: Install client dependencies**

```bash
cd /Users/sushilsahani/devsushil/mod-me/client
npm install
```

Expected: React, Vite, Tailwind installed.

- [ ] **Step 3: Create client/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ModMe — Content Moderation API</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create client/vite.config.js**

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api":    { target: "http://localhost:3000", changeOrigin: true, credentials: true },
      "/auth":   { target: "http://localhost:3000", changeOrigin: true, credentials: true },
      "/moderate": { target: "http://localhost:3000", changeOrigin: true, credentials: true },
    },
  },
  build: {
    outDir: "dist",
  },
});
```

- [ ] **Step 5: Create client/tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca" },
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 6: Create client/postcss.config.js**

```javascript
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

- [ ] **Step 7: Create client/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Create client/src/main.jsx**

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

- [ ] **Step 9: Commit**

```bash
cd /Users/sushilsahani/devsushil/mod-me
git add client/
git commit -m "feat: scaffold React + Vite + Tailwind client"
```

---

## Task 13: client/src/lib/api.js — Fetch Wrapper with Auto Token Refresh

**Files:**
- Create: `client/src/lib/api.js`

- [ ] **Step 1: Create client/src/lib/api.js**

```javascript
// client/src/lib/api.js

/**
 * Fetch wrapper that:
 * 1. Always sends credentials (cookies)
 * 2. On 401, attempts one token refresh then retries
 * 3. Returns parsed JSON or throws
 */
async function refreshToken() {
  await fetch("/auth/refresh", { method: "POST", credentials: "include" });
}

export async function api(path, options = {}) {
  const opts = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (options.body instanceof FormData) {
    delete opts.headers["Content-Type"];
  }

  let res = await fetch(path, opts);

  // Auto-refresh on 401 and retry once
  if (res.status === 401) {
    await refreshToken();
    res = await fetch(path, opts);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const apiGet    = (path)         => api(path, { method: "GET" });
export const apiPost   = (path, body)   => api(path, { method: "POST",   body: body instanceof FormData ? body : JSON.stringify(body) });
export const apiPatch  = (path, body)   => api(path, { method: "PATCH",  body: JSON.stringify(body) });
export const apiDelete = (path)         => api(path, { method: "DELETE" });
```

- [ ] **Step 2: Commit**

```bash
git add client/src/lib/api.js
git commit -m "feat: add API fetch wrapper with auto token refresh"
```

---

## Task 14: client/src/App.jsx — Router + Auth Guard

**Files:**
- Create: `client/src/App.jsx`

- [ ] **Step 1: Create client/src/App.jsx**

```jsx
// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./lib/api.js";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Playground from "./pages/Playground.jsx";
import Stats from "./pages/Stats.jsx";
import Admin from "./pages/Admin.jsx";

function AuthGuard({ children, adminOnly = false }) {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet("/api/me"),
    retry: false,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (isError || !user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.is_admin) return <Navigate to="/dashboard" replace />;

  return children;
}

function Nav({ user }) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <span className="font-bold text-brand-600 text-lg">ModMe</span>
      <div className="flex items-center gap-6 text-sm">
        <a href="/dashboard"  className="text-gray-600 hover:text-brand-600">Keys</a>
        <a href="/playground" className="text-gray-600 hover:text-brand-600">Playground</a>
        <a href="/stats"      className="text-gray-600 hover:text-brand-600">Stats</a>
        {user?.is_admin && <a href="/admin" className="text-gray-600 hover:text-brand-600">Admin</a>}
        <button
          onClick={() => fetch("/auth/logout", { method: "POST", credentials: "include" }).then(() => window.location = "/login")}
          className="text-gray-400 hover:text-red-500"
        >
          Logout
        </button>
        <img src={user?.avatar_url} className="w-8 h-8 rounded-full" alt="" />
      </div>
    </nav>
  );
}

function ProtectedLayout({ adminOnly = false }) {
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => apiGet("/api/me"), retry: false });
  return (
    <AuthGuard adminOnly={adminOnly}>
      <Nav user={user} />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/stats"      element={<Stats />} />
          <Route path="/admin"      element={<Admin />} />
        </Routes>
      </main>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedLayout />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat: add router with auth guard and nav"
```

---

## Task 15: Login Page

**Files:**
- Create: `client/src/pages/Login.jsx`

- [ ] **Step 1: Create client/src/pages/Login.jsx**

```jsx
// client/src/pages/Login.jsx
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api.js";

export default function Login() {
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet("/api/me"),
    retry: false,
  });

  useEffect(() => {
    if (user) window.location = "/dashboard";
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm text-center">
        <div className="text-3xl font-black text-brand-600 mb-2">ModMe</div>
        <p className="text-gray-500 text-sm mb-8">Content Moderation API Platform</p>

        <a
          href="/auth/google"
          className="flex items-center justify-center gap-3 w-full border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </a>

        <p className="text-xs text-gray-400 mt-6">
          By signing in you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Login.jsx
git commit -m "feat: add login page with Google OAuth button"
```

---

## Task 16: Dashboard Page + KeyCard Component

**Files:**
- Create: `client/src/pages/Dashboard.jsx`
- Create: `client/src/components/KeyCard.jsx`

- [ ] **Step 1: Create client/src/components/KeyCard.jsx**

```jsx
// client/src/components/KeyCard.jsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPatch, apiDelete } from "../lib/api.js";

export default function KeyCard({ k }) {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(k.name);

  const revoke = useMutation({
    mutationFn: () => apiDelete(`/api/keys/${k.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keys"] }),
  });

  const rename = useMutation({
    mutationFn: () => apiPatch(`/api/keys/${k.id}`, { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["keys"] }); setEditing(false); },
  });

  function copy() {
    navigator.clipboard.writeText(k.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isExpired = k.expires_at && new Date(k.expires_at) < new Date();

  return (
    <div className={`border rounded-xl p-5 flex flex-col gap-3 ${isExpired ? "opacity-50" : "bg-white"}`}>
      <div className="flex items-center justify-between">
        {editing ? (
          <input
            className="border rounded px-2 py-1 text-sm flex-1 mr-2"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && rename.mutate()}
            autoFocus
          />
        ) : (
          <span className="font-semibold text-gray-800">{k.name}</span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${k.is_active && !isExpired ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {isExpired ? "Expired" : k.is_active ? "Active" : "Revoked"}
        </span>
      </div>

      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
        <code className="text-xs text-gray-600 flex-1 truncate">{k.key}</code>
        <button onClick={copy} className="text-xs text-brand-600 hover:text-brand-700 font-medium shrink-0">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Created {new Date(k.created_at).toLocaleDateString()}</span>
        {k.last_used_at && <span>Last used {new Date(k.last_used_at).toLocaleDateString()}</span>}
        {k.expires_at && <span>Expires {new Date(k.expires_at).toLocaleDateString()}</span>}
      </div>

      <div className="flex gap-2 pt-1">
        {editing ? (
          <>
            <button onClick={() => rename.mutate()} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700">Save</button>
            <button onClick={() => setEditing(false)} className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Rename</button>
            <button onClick={() => revoke.mutate()} className="text-xs text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50">Revoke</button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create client/src/pages/Dashboard.jsx**

```jsx
// client/src/pages/Dashboard.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "../lib/api.js";
import KeyCard from "../components/KeyCard.jsx";

export default function Dashboard() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newExpiry, setNewExpiry] = useState("");

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ["keys"],
    queryFn: () => apiGet("/api/keys"),
  });

  const createKey = useMutation({
    mutationFn: () => apiPost("/api/keys", { name: newName, expiresAt: newExpiry || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["keys"] });
      setShowModal(false);
      setNewName("");
      setNewExpiry("");
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-sm text-gray-500 mt-1">Manage keys for your applications</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          + New Key
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : keys.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔑</div>
          <p className="font-medium">No API keys yet</p>
          <p className="text-sm mt-1">Create your first key to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {keys.map(k => <KeyCard key={k.id} k={k} />)}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Create New API Key</h2>
            <label className="block text-sm text-gray-600 mb-1">Key Name *</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
              placeholder="e.g. Production, Development"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
            />
            <label className="block text-sm text-gray-600 mb-1">Expiry Date (optional)</label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2 text-sm mb-6"
              value={newExpiry}
              onChange={e => setNewExpiry(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => createKey.mutate()}
                disabled={!newName.trim() || createKey.isPending}
                className="flex-1 bg-brand-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                {createKey.isPending ? "Creating..." : "Create Key"}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Dashboard.jsx client/src/components/KeyCard.jsx
git commit -m "feat: add dashboard page with key management UI"
```

---

## Task 17: Playground Page + VerdictBadge + ScoreBar

**Files:**
- Create: `client/src/pages/Playground.jsx`
- Create: `client/src/components/VerdictBadge.jsx`
- Create: `client/src/components/ScoreBar.jsx`

- [ ] **Step 1: Create client/src/components/VerdictBadge.jsx**

```jsx
// client/src/components/VerdictBadge.jsx
const CONFIG = {
  allow: { label: "ALLOWED",  bg: "bg-green-100",  text: "text-green-700",  border: "border-green-200" },
  flag:  { label: "FLAGGED",  bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  block: { label: "BLOCKED",  bg: "bg-red-100",    text: "text-red-700",    border: "border-red-200" },
};

export default function VerdictBadge({ decision }) {
  const c = CONFIG[decision] || CONFIG.flag;
  return (
    <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-black border ${c.bg} ${c.text} ${c.border}`}>
      {decision === "allow" ? "✅" : decision === "block" ? "🚫" : "⚠️"} {c.label}
    </span>
  );
}
```

- [ ] **Step 2: Create client/src/components/ScoreBar.jsx**

```jsx
// client/src/components/ScoreBar.jsx
export default function ScoreBar({ label, score }) {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 75 ? "bg-red-500" : pct >= 50 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 w-20 shrink-0 capitalize">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-mono text-gray-700 w-10 text-right">{pct}%</span>
    </div>
  );
}
```

- [ ] **Step 3: Create client/src/pages/Playground.jsx**

```jsx
// client/src/pages/Playground.jsx
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api.js";
import VerdictBadge from "../components/VerdictBadge.jsx";
import ScoreBar from "../components/ScoreBar.jsx";

export default function Playground() {
  const [file, setFile] = useState(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const inputRef = useRef();

  const { data: keys = [] } = useQuery({
    queryKey: ["keys"],
    queryFn: () => apiGet("/api/keys"),
    select: (keys) => keys.filter(k => k.is_active),
  });

  async function runModeration() {
    if (!file || !selectedKey) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/moderate", {
        method: "POST",
        headers: { Authorization: `Bearer ${selectedKey}` },
        body: form,
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) setFile(f);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Playground</h1>
        <p className="text-sm text-gray-500 mt-1">Test the moderation API directly in your browser</p>
      </div>

      <div className="space-y-4 mb-6">
        {/* API Key selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={selectedKey}
            onChange={e => setSelectedKey(e.target.value)}
          >
            <option value="">Select a key...</option>
            {keys.map(k => (
              <option key={k.id} value={k.key}>{k.name}</option>
            ))}
          </select>
        </div>

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-brand-500 transition"
        >
          {file ? (
            <div>
              <div className="text-2xl mb-1">📎</div>
              <p className="text-sm font-medium text-gray-700">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB · {file.type}</p>
            </div>
          ) : (
            <div>
              <div className="text-3xl mb-2">☁️</div>
              <p className="text-sm font-medium text-gray-600">Drop a file here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF, MP4, WebM, MOV</p>
            </div>
          )}
          <input ref={inputRef} type="file" className="hidden" accept="image/*,video/*" onChange={e => setFile(e.target.files[0])} />
        </div>

        <button
          onClick={runModeration}
          disabled={!file || !selectedKey || loading}
          className="w-full bg-brand-600 text-white py-3 rounded-xl font-medium hover:bg-brand-700 disabled:opacity-40 transition"
        >
          {loading ? "Running moderation..." : "Run Moderation"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>
      )}

      {result && (
        <div className="bg-white border rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <VerdictBadge decision={result.finalDecision} />
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              via {result.layer === "google_vision" ? "Google Vision" : "Claude AI"}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Content Scores</p>
            <ScoreBar label="Adult"    score={result.googleScores?.adult} />
            <ScoreBar label="Violence" score={result.googleScores?.violence} />
            <ScoreBar label="Racy"     score={result.googleScores?.racy} />
          </div>

          {result.claude && (
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-700 mb-1">Claude AI Decision</p>
              <p className="text-sm text-indigo-800">{result.claude.reason}</p>
              <p className="text-xs text-indigo-500 mt-1">Confidence: {Math.round((result.claude.confidence || 0) * 100)}%</p>
            </div>
          )}

          <div className="flex gap-4 text-xs text-gray-400">
            <span>Google: {result.performance?.googleMs}ms</span>
            {result.performance?.claudeMs > 0 && <span>Claude: {result.performance.claudeMs}ms</span>}
            <span>Total: {result.performance?.totalMs}ms</span>
          </div>

          <div>
            <button onClick={() => setShowRaw(!showRaw)} className="text-xs text-gray-400 hover:text-gray-600">
              {showRaw ? "Hide" : "Show"} raw JSON
            </button>
            {showRaw && (
              <pre className="mt-2 bg-gray-50 rounded-lg p-4 text-xs overflow-auto max-h-64 text-gray-600">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Playground.jsx client/src/components/VerdictBadge.jsx client/src/components/ScoreBar.jsx
git commit -m "feat: add playground page with drag-drop upload and result display"
```

---

## Task 18: Stats Page + UsageChart Component

**Files:**
- Create: `client/src/pages/Stats.jsx`
- Create: `client/src/components/UsageChart.jsx`

- [ ] **Step 1: Create client/src/components/UsageChart.jsx**

```jsx
// client/src/components/UsageChart.jsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = { allow: "#22c55e", flag: "#f59e0b", block: "#ef4444" };

export function DailyLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DecisionDonut({ data }) {
  const formatted = data.map(d => ({ name: d.final_decision, value: d.count, fill: COLORS[d.final_decision] || "#94a3b8" }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={formatted} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}>
          {formatted.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Pie>
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Create client/src/pages/Stats.jsx**

```jsx
// client/src/pages/Stats.jsx
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api.js";
import { DailyLineChart, DecisionDonut } from "../components/UsageChart.jsx";

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Stats() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiGet("/api/stats"),
  });

  if (isLoading) return <p className="text-gray-400 text-sm">Loading stats...</p>;

  const { summary, daily, decisions, topKey } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usage Stats</h1>
        <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Requests"  value={summary?.total_requests?.toLocaleString()} />
        <StatCard label="Avg Latency"     value={summary?.avg_latency_ms ? `${summary.avg_latency_ms}ms` : null} />
        <StatCard label="Blocked"         value={summary?.total_blocked?.toLocaleString()} />
        <StatCard label="Most Active Key" value={topKey?.name} sub={topKey ? `${topKey.call_count} calls` : null} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Requests Per Day</p>
          <DailyLineChart data={daily || []} />
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Decision Breakdown</p>
          <DecisionDonut data={decisions || []} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Stats.jsx client/src/components/UsageChart.jsx
git commit -m "feat: add stats page with line chart and donut chart"
```

---

## Task 19: Admin Page

**Files:**
- Create: `client/src/pages/Admin.jsx`

- [ ] **Step 1: Create client/src/pages/Admin.jsx**

```jsx
// client/src/pages/Admin.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiDelete } from "../lib/api.js";

export default function Admin() {
  const qc = useQueryClient();

  const { data: stats }  = useQuery({ queryKey: ["admin-stats"], queryFn: () => apiGet("/api/admin/stats") });
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: () => apiGet("/api/admin/users") });
  const { data: keys  = [] } = useQuery({ queryKey: ["admin-keys"],  queryFn: () => apiGet("/api/admin/keys") });

  const updateUser = useMutation({
    mutationFn: ({ id, ...body }) => apiPatch(`/api/admin/users/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const revokeKey = useMutation({
    mutationFn: (id) => apiDelete(`/api/admin/keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-keys"] }),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-1">Platform management</p>
      </div>

      {/* Platform Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[["Total Users", stats.total_users], ["Active Keys", stats.total_active_keys], ["Total Requests", stats.total_requests]].map(([label, val]) => (
            <div key={label} className="bg-white border rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{val?.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Users</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Email", "Plan", "Keys", "Calls", "Joined", "Admin", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-800">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.plan}
                    onChange={e => updateUser.mutate({ id: u.id, plan: e.target.value })}
                    className="border rounded px-2 py-1 text-xs"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.key_count}</td>
                <td className="px-4 py-3 text-gray-500">{u.total_calls}</td>
                <td className="px-4 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={u.is_admin}
                    onChange={e => updateUser.mutate({ id: u.id, isAdmin: e.target.checked })}
                  />
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{u.id.slice(0, 8)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Keys Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">All API Keys</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Name", "Owner", "Calls", "Last Used", "Status", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {keys.map(k => (
              <tr key={k.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{k.name}</td>
                <td className="px-4 py-3 text-gray-500">{k.owner_email}</td>
                <td className="px-4 py-3 text-gray-500">{k.call_count}</td>
                <td className="px-4 py-3 text-gray-400">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${k.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {k.is_active ? "Active" : "Revoked"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {k.is_active && (
                    <button onClick={() => revokeKey.mutate(k.id)} className="text-xs text-red-500 hover:text-red-700">Revoke</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Admin.jsx
git commit -m "feat: add admin panel with user and key management"
```

---

## Task 20: Final Wiring — Build Script + .env Update + Verify Dev Server

**Files:**
- Modify: `.env` (add new vars)
- No code changes — verification only

- [ ] **Step 1: Copy .env.example to .env and fill in values**

Your `.env` must now include these additional entries (fill in real values):
```env
GOOGLE_CLIENT_ID=<from Google Cloud Console → APIs → Credentials>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console → APIs → Credentials>
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
COOKIE_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
DATABASE_URL=<your Neon DB connection string>
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

- [ ] **Step 2: Run DB migration**

```bash
npm run db:migrate
```

Expected: `DB migrations complete` printed with no errors.

- [ ] **Step 3: Start both servers**

Terminal 1:
```bash
npm run dev
```
Expected: `{"level":"info","msg":"Moderation service running","port":3000,...}`

Terminal 2:
```bash
npm run dev:client
```
Expected: Vite dev server running on `http://localhost:5173`

- [ ] **Step 4: Verify login flow**

Open `http://localhost:5173` → should redirect to `/login` → click "Continue with Google" → should complete OAuth and land on `/dashboard`.

- [ ] **Step 5: Verify key creation**

In dashboard: click "+ New Key" → enter a name → create → key should appear with copy button.

- [ ] **Step 6: Verify playground**

Go to `/playground` → select the key you just created → drop a safe image → click "Run Moderation" → should show ALLOWED verdict with scores.

- [ ] **Step 7: Test production build**

```bash
npm run build:client
NODE_ENV=production npm start
```

Open `http://localhost:3000` → React app should load from Express static files.

- [ ] **Step 8: Final commit**

```bash
git add .
git commit -m "feat: complete production SaaS user flow — auth, keys, stats, playground, admin"
```
