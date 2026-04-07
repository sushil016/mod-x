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
  const sql = (await import("./db.js")).default;
  const [user] = await sql`
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
