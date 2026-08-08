# ── Stage 1: Build React client ─────────────────────────────────────────────
FROM node:22-bookworm-slim AS client-builder

WORKDIR /build/client
COPY client/package.json client/yarn.lock ./
RUN yarn install --frozen-lockfile --silent

COPY client/ ./
RUN yarn build             # outputs to /build/client/dist


# ── Stage 2: Production server ───────────────────────────────────────────────
FROM node:22-bookworm-slim AS server

# ffmpeg required for GIF/video frame extraction
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install backend deps only (no devDependencies)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true --silent

# Copy source
COPY src/       ./src/
COPY queues/    ./queues/
COPY scripts/   ./scripts/

# Copy pre-built React SPA into the location Express serves from
COPY --from=client-builder /build/client/dist ./client/dist


# Production defaults. Override PORT from your hosting provider when needed.
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Migrations run on startup before the server binds
CMD ["node", "src/index.js"]
