# User Flow & Developer SaaS Dashboard — Design Spec

## Goal
Add a full production-ready SaaS layer on top of the existing moderation engine: Google OAuth for developer registration, API key lifecycle management, per-key rate limiting, usage analytics, a live playground, and an admin panel — all served from the same Express server with an embedded React dashboard.

## Architecture Overview

```
mod-me/
├── src/                          ← existing moderation engine (unchanged)
│   ├── db.js                     ← NEW: Neon PostgreSQL connection + migrations
│   ├── routes/
│   │   ├── auth.js               ← NEW: Google OAuth + JWT refresh/logout
│   │   ├── keys.js               ← NEW: API key CRUD
│   │   ├── stats.js              ← NEW: usage stats per developer
│   │   └── admin.js              ← NEW: admin-only user/key/stats management
│   ├── middleware/
│   │   ├── auth-jwt.js           ← NEW: JWT verify middleware (dashboard routes)
│   │   └── rate-limiter.js       ← NEW: Redis sliding window per API key
│   ├── services/
│   │   └── usage-logger.js       ← NEW: logs every moderation call to DB
│   ├── api-key-middleware.js     ← MODIFIED: reads keys from DB, not .env
│   └── index.js                  ← MODIFIED: mount new routes, serve React
│
├── client/                       ← NEW: React + Vite dashboard
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx         ← Google sign-in
│   │   │   ├── Dashboard.jsx     ← key management
│   │   │   ├── Playground.jsx    ← live test tool
│   │   │   ├── Stats.jsx         ← usage charts
│   │   │   └── Admin.jsx         ← admin panel
│   │   ├── components/
│   │   │   ├── KeyCard.jsx       ← single key row (copy/revoke/rename)
│   │   │   ├── VerdictBadge.jsx  ← allow/flag/block colored badge
│   │   │   ├── ScoreBar.jsx      ← visual score bars for adult/violence/racy
│   │   │   └── UsageChart.jsx    ← recharts line + donut charts
│   │   ├── lib/
│   │   │   └── api.js            ← fetch wrapper for all API calls
│   │   └── App.jsx               ← React Router routes + auth guard
│   ├── index.html
│   └── vite.config.js            ← proxy /api/* and /auth/* to Express in dev
```

---

## Database Schema (Neon PostgreSQL)

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id   TEXT UNIQUE NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  plan        TEXT NOT NULL DEFAULT 'free',   -- 'free' | 'pro'
  is_admin    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  key          TEXT UNIQUE NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  expires_at   TIMESTAMPTZ,                   -- NULL = never expires
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT UNIQUE NOT NULL,           -- SHA-256 of the actual token
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE usage_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id     UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  source_type    TEXT NOT NULL,               -- 'image' | 'gif' | 'video'
  final_decision TEXT NOT NULL,              -- 'allow' | 'flag' | 'block'
  layer          TEXT NOT NULL,              -- 'google_vision' | 'claude_vertex'
  google_ms      INT NOT NULL DEFAULT 0,
  claude_ms      INT NOT NULL DEFAULT 0,
  total_ms       INT NOT NULL DEFAULT 0,
  file_size      INT NOT NULL DEFAULT 0,     -- bytes
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_api_key_id ON usage_logs(api_key_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX idx_api_keys_key ON api_keys(key);
```

---

## Auth Flow (Google OAuth + JWT)

1. Developer clicks "Sign in with Google" → `GET /auth/google`
2. Google redirects back → `GET /auth/google/callback`
3. Server upserts user in `users` table
4. Server issues two httpOnly cookies:
   - `access_token`: JWT, 15 min expiry, contains `{ userId, email, isAdmin }`
   - `refresh_token`: opaque random token, 30 days, hash stored in `refresh_tokens` table
5. Developer is redirected to `/dashboard`
6. On access token expiry: React calls `POST /auth/refresh` automatically
7. Logout: `POST /auth/logout` clears cookies + deletes refresh token from DB

**Packages:** `passport`, `passport-google-oauth20`, `jsonwebtoken`, `cookie-parser`

---

## API Routes

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /auth/google | None | Start Google OAuth |
| GET | /auth/google/callback | None | OAuth callback, issue cookies |
| POST | /auth/refresh | Cookie | Issue new access token |
| POST | /auth/logout | Cookie | Clear cookies, delete refresh token |

### Developer (JWT cookie required)
| Method | Path | Description |
|---|---|---|
| GET | /api/me | Current user info |
| GET | /api/keys | List all my API keys |
| POST | /api/keys | Create new key (body: `{ name, expiresAt? }`) |
| PATCH | /api/keys/:id | Rename key (body: `{ name }`) |
| DELETE | /api/keys/:id | Revoke key (soft delete: is_active=false) |
| GET | /api/stats | Usage stats last 30 days (calls/day, decisions breakdown, avg latency) |

### Moderation (API key Bearer token required)
| Method | Path | Description |
|---|---|---|
| POST | /moderate | Existing route — now rate-limited + logs to usage_logs |

### Admin (JWT cookie + is_admin=true required)
| Method | Path | Description |
|---|---|---|
| GET | /api/admin/users | All users with key count + usage count |
| PATCH | /api/admin/users/:id | Toggle is_admin, change plan |
| GET | /api/admin/keys | All active API keys across all users |
| DELETE | /api/admin/keys/:id | Force-revoke any key |
| GET | /api/admin/stats | Platform-wide: total calls, total users, decisions breakdown |

---

## Rate Limiting

- Implemented with Redis (already running for BullMQ)
- Algorithm: sliding window counter per API key (1-hour window)
- Free plan: **100 requests / hour**
- Pro plan: **1000 requests / hour**
- On limit exceeded: `429 Too Many Requests` with `Retry-After` header
- Rate limit headers on every response:
  - `X-RateLimit-Limit`: total allowed
  - `X-RateLimit-Remaining`: remaining in window
  - `X-RateLimit-Reset`: Unix timestamp when window resets

---

## Modified: api-key-middleware.js

Instead of reading from `.env`, now queries `api_keys` table:
1. Look up key in `api_keys` WHERE `key = $1 AND is_active = true`
2. If `expires_at` is set and is in the past → 401 Expired
3. If not found → 401 Invalid
4. Update `last_used_at = now()`
5. Attach `req.apiKey = { id, userId, plan }` for rate limiter + usage logger

---

## Usage Logger (src/services/usage-logger.js)

Called at end of every `POST /moderate` request:
```
INSERT INTO usage_logs (api_key_id, user_id, source_type, final_decision, layer, google_ms, claude_ms, total_ms, file_size)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
```
Fire-and-forget (does not block response).

---

## React Dashboard Pages

### Login (`/login`)
- Centered card, logo, "Continue with Google" button
- Redirects to `/dashboard` if already logged in

### Dashboard (`/dashboard`)
- Header: user avatar + name + plan badge
- "Create New Key" button → modal with name input + optional expiry date
- Table of API keys: name, created date, last used, expiry, status badge, copy/rename/revoke actions
- Empty state when no keys

### Playground (`/playground`)
- Drag-and-drop file upload zone (image/GIF/video)
- API key selector (dropdown of user's active keys)
- "Run Moderation" button
- Result panel:
  - Large verdict badge (ALLOW / FLAG / BLOCK) with color
  - Score bars: adult, violence, racy (0–1 scale)
  - Layer used (Google Vision / Claude)
  - Performance: Google ms + Claude ms + total ms
  - Raw JSON collapsible

### Stats (`/stats`)
- Line chart: requests per day (last 30 days) — recharts
- Donut chart: allow / flag / block breakdown
- Stats cards: total requests, avg latency, most active key

### Admin (`/admin`) — only visible if `isAdmin=true`
- Users table: email, plan, key count, total calls, joined date + change plan dropdown + toggle admin
- Keys table: key name, owner email, created, last used, revoke button
- Platform stats: total users, total keys, total moderation calls

---

## Frontend Tech Stack

| Package | Purpose |
|---|---|
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| TanStack Query v5 | Data fetching + caching |
| Tailwind CSS v3 | Styling |
| Recharts | Usage charts |
| Vite | Build tool |

---

## New Environment Variables

```env
# Auth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
JWT_SECRET=your-random-secret-min-32-chars
COOKIE_SECRET=your-random-cookie-secret

# Neon DB
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# App
CLIENT_URL=http://localhost:5173     # React dev server
NODE_ENV=development
```

---

## New npm Dependencies

```json
Backend:
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "jsonwebtoken": "^9.0.2",
  "cookie-parser": "^1.4.6",
  "postgres": "^3.4.4",
  "cors": "^2.8.5"

Frontend (client/package.json):
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.23.1",
  "@tanstack/react-query": "^5.40.0",
  "recharts": "^2.12.7"

Frontend devDependencies:
  "vite": "^5.3.1",
  "@vitejs/plugin-react": "^4.3.1",
  "tailwindcss": "^3.4.4",
  "autoprefixer": "^10.4.19",
  "postcss": "^8.4.38"
```

---

## Build & Dev Workflow

**Development:**
```bash
# Terminal 1: Express backend on :3000
npm run dev

# Terminal 2: Vite React on :5173 (proxies /api and /auth to :3000)
npm run dev:client
```

**Production:**
```bash
npm run build:client     # vite build → client/dist/
npm start                # Express serves client/dist/ as static + all API routes
```

**package.json scripts to add:**
```json
"dev:client": "cd client && npm run dev",
"build:client": "cd client && npm run build",
"db:migrate": "node src/db.js"
```

---

## Security Checklist

- [x] httpOnly cookies (XSS protection — JS cannot read tokens)
- [x] CORS restricted to `CLIENT_URL` in development
- [x] JWT short-lived (15 min) + refresh token rotation
- [x] Refresh tokens hashed in DB (not stored raw)
- [x] API keys validated from DB on every request (instant revocation works)
- [x] Rate limiting prevents API abuse
- [x] Admin routes check `is_admin` flag server-side
- [x] `expires_at` enforced server-side on every key lookup
- [x] `service-account.json` and `.env` in `.gitignore`

---

## What Stays Unchanged

- `src/orchestrator.js` — moderation logic untouched
- `src/google-vision.js`, `src/claude-vertex.js`, `src/decision-engine.js` — untouched
- `src/frame-extractor.js` — untouched
- `POST /moderate` response shape — same JSON format, just now also logs + rate-limits
