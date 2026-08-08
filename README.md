# ModMe

One moderation API to protect user uploads in real time.

ModMe is an open-source image, GIF, and video moderation system for developers, startups, and companies that accept user-generated media. It gives your app a clear `allow`, `flag`, or `block` response before uploaded content becomes visible.

It is built for teams that do not want to spend days wiring file detection, frame extraction, AI scoring, API keys, dashboards, usage logs, and developer docs from scratch.

## What It Does

- Moderates images, GIFs, and videos through one endpoint.
- Uses Google Cloud Vision SafeSearch as the fast first-pass layer.
- Escalates uncertain content to NVIDIA's OpenAI-compatible LLM API for AI reasoning.
- Extracts frames from GIFs and videos with `ffmpeg`.
- Returns structured decisions your app can use immediately.
- Includes a React dashboard for API keys, usage analytics, playground testing, settings, admin, and checkout.
- Supports local development login so you can test without Google OAuth.

## How The Pipeline Works

```text
User upload
  |
  v
File type detection
  |
  +-- image -> direct SafeSearch check
  +-- GIF   -> extract frames -> parallel SafeSearch
  +-- video -> sample frames  -> parallel SafeSearch
  |
  v
Decision engine
  |
  +-- clearly safe   -> allow
  +-- clearly unsafe -> block
  +-- gray zone      -> NVIDIA LLM reasoning
  |
  v
allow / flag / block + scores + reason + latency
```

The key idea is cost control: obvious uploads are handled by Google Vision, while expensive AI reasoning is used only for gray-zone cases.

## Tech Stack

| Area | Technology |
|---|---|
| Backend | Node.js, Express |
| Frontend | React, Vite, Tailwind CSS |
| Auth | Google OAuth, JWT cookies, dev login |
| Database | PostgreSQL |
| Moderation layer 1 | Google Cloud Vision SafeSearch |
| Moderation layer 2 | NVIDIA OpenAI-compatible LLM API |
| Video/GIF processing | ffmpeg, fluent-ffmpeg |
| Upload handling | multer |
| Package manager | Yarn Classic |
| Deployment shape | Docker |

## Project Structure

```text
mod-me/
├── client/                  # React/Vite frontend
│   ├── src/components/      # UI components
│   ├── src/pages/           # Landing, docs, dashboard, admin, etc.
│   └── vite.config.js       # Local proxy to Express
├── src/                     # Express backend
│   ├── routes/              # Auth, keys, stats, admin, billing
│   ├── middleware/          # JWT, rate limiting, API key auth
│   ├── orchestrator.js      # Main moderation flow
│   ├── google-vision.js     # SafeSearch wrapper
│   ├── claude-vertex.js     # NVIDIA LLM reasoning wrapper
│   ├── frame-extractor.js   # GIF/video frame extraction
│   └── db.js                # PostgreSQL migrations
├── queues/                  # Human review queue hook
├── tests/                   # Manual image/GIF/video scripts
├── Dockerfile               # Production container
├── package.json             # Backend scripts/deps
└── yarn.lock
```

## Prerequisites

Install these first:

- Node.js 22+
- Yarn 1.x
- PostgreSQL database URL, for example Neon or Supabase
- ffmpeg
- Google Cloud project with Vision API enabled
- NVIDIA API key, if using gray-zone reasoning

On macOS:

```bash
brew install ffmpeg
corepack enable
```

## 1. Clone The Project

```bash
git clone https://github.com/sushil016/mod-x.git
cd mod-me
```

## 2. Install Dependencies

Install backend dependencies:

```bash
yarn install
```

Install frontend dependencies:

```bash
cd client
yarn install
cd ..
```

## 3. Configure Environment Variables

Create your local `.env`:

```bash
cp .env.example .env
```

Minimum local development values:

```env
PORT=4000
CLIENT_URL=http://localhost:5173
NODE_ENV=development

DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

JWT_SECRET=your-random-secret-minimum-32-characters
COOKIE_SECRET=your-random-cookie-secret-minimum-32-chars

DEV_AUTH_EMAIL=dev@modme.local
DEV_AUTH_NAME=Local Developer
```

For real moderation, also configure:

```env
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
# For Docker, use GOOGLE_APPLICATION_CREDENTIALS_JSON instead of a local file.
GOOGLE_APPLICATION_CREDENTIALS_JSON=
# Or use base64 JSON to avoid broken private_key newlines in .env/dashboard values.
GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64=
GOOGLE_CLOUD_PROJECT=your-gcp-project-id

NVIDIA_API_KEY=your-nvidia-api-key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=deepseek-ai/deepseek-v4-pro
NVIDIA_MAX_TOKENS=16384
```

For Google OAuth in production:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback
```

### Switching To Another GCP Account

The LLM layer does not use GCP anymore. It uses NVIDIA through `NVIDIA_API_KEY`.

For a new GCP account, update only the Google services:

1. Create or choose a Google Cloud project.
2. Enable the Cloud Vision API.
3. Create a service account with Vision API access.
4. Download the service account JSON.
5. Locally, set `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json`.
6. In Docker, remove `GOOGLE_APPLICATION_CREDENTIALS` and set either `GOOGLE_APPLICATION_CREDENTIALS_JSON` to the full JSON content or `GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64` to the base64-encoded JSON.
7. Update `GOOGLE_CLOUD_PROJECT` to the new project ID.
8. If you use Google login, create OAuth credentials in the new account and update `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL`.

## 4. Run Database Migrations

```bash
yarn db:migrate
```

This creates:

- `users`
- `api_keys`
- `refresh_tokens`
- `usage_logs`
- `billing_events`

## 5. Start Local Development

Terminal 1, start the backend:

```bash
yarn dev
```

Terminal 2, start the frontend:

```bash
yarn dev:client
```

Open:

```text
http://localhost:5173
```

The Vite frontend proxies API calls to:

```text
http://localhost:4000
```

## 6. Local Login

For development, click:

```text
Continue as local developer
```

or open:

```text
http://localhost:5173/auth/dev-login
```

This creates/reuses a local developer account, sets the same auth cookies as production login, and redirects to the dashboard.

Important: `/auth/dev-login` is disabled in production.

## 7. Create An API Key

After local login:

1. Go to `/dashboard`.
2. Click `New Key`.
3. Give it a name like `Local Dev`.
4. Copy the generated API key.

API keys start with your generated key format and are stored in PostgreSQL.

## 8. Test The Moderation Endpoint

Use your generated API key:

```bash
curl -X POST http://localhost:4000/moderate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@./tests/sample.jpg"
```

Example response:

```json
{
  "finalDecision": "allow",
  "layer": "google_vision",
  "sourceType": "image",
  "googleScores": {
    "adult": 0.05,
    "violence": 0.05,
    "racy": 0.25
  },
  "performance": {
    "googleMs": 312,
    "llmMs": 0,
    "claudeMs": 0,
    "totalMs": 312
  }
}
```

## Useful Scripts

Root project:

```bash
yarn dev              # Start Express backend with nodemon
yarn dev:client       # Start Vite frontend
yarn build:client     # Build frontend
yarn start            # Start production Express server
yarn db:migrate       # Run database migrations
yarn test:image       # Manual image moderation test
yarn test:gif         # Manual GIF moderation test
yarn test:video       # Manual video moderation test
```

Client project:

```bash
cd client
yarn dev
yarn build
yarn preview
```

## API Overview

### `GET /health`

Returns server health.

```json
{ "status": "ok" }
```

### `GET /api/me`

Returns the signed-in developer. Requires JWT cookie.

### `GET /api/keys`

Lists API keys for the signed-in developer.

### `POST /api/keys`

Creates an API key.

```json
{
  "name": "Production",
  "expiresAt": null
}
```

### `POST /moderate`

Moderates one uploaded file. Requires API key.

```bash
curl -X POST http://localhost:4000/moderate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@image.jpg"
```

Supported file types:

- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`
- `video/mp4`
- `video/webm`
- `video/quicktime`

## Decision Meanings

| Decision | Meaning |
|---|---|
| `allow` | Safe enough to publish immediately |
| `flag` | Needs review or delayed handling |
| `block` | Should be rejected before publishing |

## Thresholds

You can tune moderation behavior in `.env`:

```env
THRESHOLD_BLOCK_ADULT=0.75
THRESHOLD_BLOCK_VIOLENCE=0.75
THRESHOLD_BLOCK_RACY=0.95

THRESHOLD_REVIEW_ADULT=0.50
THRESHOLD_REVIEW_VIOLENCE=0.50
THRESHOLD_REVIEW_RACY=0.75
```

## GIF And Video Sampling

```env
GIF_FRAME_COUNT=6
VIDEO_FRAME_INTERVAL_SECONDS=2
VIDEO_MAX_FRAMES=30
```

For videos, ModMe samples frames instead of sending the entire video to the AI layer. This keeps latency and cost under control.

## Docker Deployment

Build the image:

```bash
docker build -t modme .
```

Run locally:

```bash
docker run --env-file .env -p 8080:8080 modme
```

The Docker image:

- builds the React frontend
- installs backend production dependencies
- installs `ffmpeg`
- serves the built frontend from Express
- exposes port `8080`

Do not bake secrets into the image. Set environment variables in your hosting provider.

For Docker deployments, do not set `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json` unless that file exists inside the container. Prefer `GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64` or `GOOGLE_APPLICATION_CREDENTIALS_JSON`. The app writes normalized credentials to a temporary file at startup for Google SDKs.

## Azure VM Deployment With A Custom Domain And HTTPS

The production deployment runs the app, Redis, and Caddy in Docker Compose on one Azure Ubuntu VM. Caddy serves the React app and API at the same hostname, redirects HTTP to HTTPS, and automatically obtains and renews the TLS certificate.

### 1. Provision the VM

Create an **Ubuntu 24.04 LTS** Azure VM with at least 2 vCPU and 4 GB RAM. In its Network Security Group, allow inbound TCP ports **80** and **443** from the internet; restrict SSH (22) to your own IP address.

Install Docker Engine and the Compose plugin, then add your deployment user to the `docker` group. Azure documents an Ubuntu VM option with Docker preinstalled as well.

### 2. Point the domain to Azure

Create these DNS records at your domain provider before starting Caddy:

| Record | Host | Value |
|---|---|---|
| `A` | `modme` | your Azure VM public IPv4 address |
| `AAAA` | `modme` | your Azure VM IPv6 address (only if configured) |

Replace `modme` with the subdomain you want, such as `api` or `app`. Do not create an `AAAA` record unless that IPv6 address is reachable. Wait until `dig +short modme.example.com` returns the VM address.

### 3. Configure and start

```bash
git clone https://github.com/sushil016/mod-x.git modme
cd modme
cp deploy/.env.production.example .env
chmod 600 .env
```

Set `DOMAIN`, `CLIENT_URL`, and `GOOGLE_CALLBACK_URL` to your final HTTPS hostname. Also set the database URL, Google service-account JSON, NVIDIA key, and fresh JWT/cookie secrets. In Google Cloud Console, add the same callback URL to your OAuth application's authorized redirect URIs.

Then deploy:

```bash
./scripts/deploy-azure-vm.sh
```

Check the service:

```bash
docker compose ps
docker compose logs --follow caddy app
curl https://modme.example.com/health
```

The first certificate request happens only after DNS resolves to the VM and ports 80/443 are reachable. Caddy stores certificates in its persistent Docker volume and renews them automatically.

### Updates

```bash
git pull --ff-only
./scripts/deploy-azure-vm.sh
```

Do not expose port 8080 or Redis to the internet: Compose exposes only Caddy on ports 80 and 443. Use a managed PostgreSQL provider such as Neon, Supabase, or Azure Database for PostgreSQL rather than running production PostgreSQL on this VM.

## Security Notes

- Keep `JWT_SECRET` and `COOKIE_SECRET` strong and private.
- Never commit `.env` or service account files.
- Disable local dev login in production by keeping `NODE_ENV=production`.
- Do not store raw card numbers. The current checkout demo records only safe test metadata.
- Rotate API keys if they are exposed.

## Troubleshooting

### Frontend cannot reach backend

Make sure the backend is running on port `3000`:

```bash
yarn dev
```

Then restart the frontend:

```bash
yarn dev:client
```

### Login redirects incorrectly

Check:

```env
CLIENT_URL=http://localhost:5173
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback
```

For local development, use `/auth/dev-login`.

### GIF or video moderation fails

Check that `ffmpeg` is installed:

```bash
ffmpeg -version
```

### Database errors

Confirm `DATABASE_URL` is valid, then run:

```bash
yarn db:migrate
```

## Contributing

ModMe is free and open source. Contributions are welcome.

Good areas to improve:

- webhook delivery
- human review queue UI
- audio moderation for videos
- animated WebP support
- batch moderation endpoint
- calibration from reviewer overrides
- better deployment templates

If this project helps you, give it a star and open an issue or pull request.
