# ── Stage 1: Build React client ─────────────────────────────────────────────
FROM node:22-alpine AS client-builder

WORKDIR /build/client
COPY client/package*.json ./
RUN npm ci --silent

COPY client/ ./
RUN npm run build          # outputs to /build/client/dist


# ── Stage 2: Production server ───────────────────────────────────────────────
FROM node:22-alpine AS server

# ffmpeg required for GIF/video frame extraction
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Install backend deps only (no devDependencies)
COPY package*.json ./
RUN npm ci --omit=dev --silent

# Copy source
COPY src/       ./src/
COPY queues/    ./queues/
COPY scripts/   ./scripts/

# Copy pre-built React SPA into the location Express serves from
COPY --from=client-builder /build/client/dist ./client/dist

# Cloud Run sets PORT env var automatically — we honour it in index.js
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Migrations run on startup before the server binds
CMD ["node", "src/index.js"]
