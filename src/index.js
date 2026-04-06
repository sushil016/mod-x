// src/index.js
import "dotenv/config";
import express from "express";
import multer from "multer";
import { runModeration } from "./orchestrator.js";
import { requireApiKey } from "./api-key-middleware.js";
import { logger } from "./utils.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3000");

// 100 MB upload limit; stored in memory (no disk write before moderation)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

// Health check (no auth required — used by load balancers)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

// All moderation routes require a valid API key
app.use(requireApiKey);

// POST /moderate — single file moderation
app.post("/moderate", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded. Use multipart/form-data with field name 'file'." });
  }

  if (!ALLOWED_TYPES.has(req.file.mimetype)) {
    return res.status(415).json({
      error: `Unsupported file type: ${req.file.mimetype}`,
      supported: [...ALLOWED_TYPES],
    });
  }

  try {
    const result = await runModeration(req.file.buffer, req.file.mimetype, {
      uploadId: req.headers["x-upload-id"],
      userId:   req.headers["x-user-id"],
      filename: req.file.originalname,
    });

    // 200 = allowed, 422 = flagged or blocked
    const statusCode = result.finalDecision === "allow" ? 200 : 422;
    return res.status(statusCode).json(result);

  } catch (err) {
    logger.error("Fatal moderation error", { error: err.message });
    return res.status(500).json({ error: "Moderation service error", detail: err.message });
  }
});

app.listen(PORT, () => {
  logger.info(`Moderation service running`, { port: PORT });
});
