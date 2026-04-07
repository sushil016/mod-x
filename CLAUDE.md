# CLAUDE.md — Image / GIF / Video Moderation System

making of this product is this product is will provide a api key to user let them use in their application very easily just like plug and play...

## Project Overview

A production-ready content moderation pipeline for **images, GIFs, and videos** using:
- **Google Cloud Vision API** — primary fast moderation layer
- **Claude via Google Vertex AI** — secondary context-aware layer (gray zone only)
- **ffmpeg** — frame extraction for GIFs and videos

This system is designed to be cost-efficient: Claude is only invoked when Google Vision is uncertain (~15% of content), keeping API costs low.

---

## Architecture

```
ANY content (Image / GIF / Video)
           ↓
   [ File Type Detection ]
  ↙           ↓           ↘
Image        GIF          Video
  ↓           ↓             ↓
Direct     Extract       Extract
           N frames      1 frame/2s
              ↓             ↓
     [ Google Cloud Vision SafeSearch API ]
     (parallel frame analysis for GIF/Video)
                ↓
   ┌────────────────────────────────────┐
   │  score > BLOCK threshold (0.75)?  │ → ❌ BLOCK immediately
   │  score < ALLOW threshold (0.50)?  │ → ✅ ALLOW immediately
   │  score in gray zone (0.50-0.75)?  │ → escalate to Claude
   └────────────────────────────────────┘
                        ↓
           [ Claude via Vertex AI ]
           (sends worst flagged frame)
           (with Google scores as context)
                        ↓
          allow / flag / block + reason
                        ↓
              [ flag ] → human review queue
```

---

## Tech Stack

| Component | Technology |
|---|---|
| Primary moderation | Google Cloud Vision SafeSearch API |
| Secondary moderation | Claude Sonnet via Google Cloud Vertex AI |
| Frame extraction | ffmpeg + fluent-ffmpeg (Node.js) |
| Runtime | Node.js (ESM) |
| File handling | sharp (image processing), fs/tmp |
| Queue (for flagged) | Optional: Azure Service Bus / BullMQ |

---

## Environment Variables

```env
# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
GOOGLE_CLOUD_PROJECT=your-gcp-project-id

# Vertex AI (Claude)
VERTEX_AI_REGION=us-east5
VERTEX_AI_PROJECT=dazzling-spirit-426406-m4
VERTEX_AI_MODEL=claude-sonnet-4-5   # or claude-sonnet-4-20250514

# Thresholds (tune per platform)
THRESHOLD_BLOCK_ADULT=0.75
THRESHOLD_BLOCK_VIOLENCE=0.75
THRESHOLD_BLOCK_RACY=0.95
THRESHOLD_REVIEW_ADULT=0.50
THRESHOLD_REVIEW_VIOLENCE=0.50
THRESHOLD_REVIEW_RACY=0.75

# GIF/Video frame sampling
GIF_FRAME_COUNT=6
VIDEO_FRAME_INTERVAL_SECONDS=2
VIDEO_MAX_FRAMES=30        # cap to avoid huge bills on long videos
```

---

## Project Structure

```
moderation/
├── CLAUDE.md                    ← this file
├── package.json
├── .env
├── service-account.json         ← Google Cloud service account key
├── src/
│   ├── index.js                 ← main entry / Express route handler
│   ├── orchestrator.js          ← master moderation flow controller
│   ├── google-vision.js         ← Google Vision API wrapper
│   ├── claude-vertex.js         ← Claude via Vertex AI wrapper
│   ├── frame-extractor.js       ← ffmpeg frame extraction for GIF/video
│   ├── decision-engine.js       ← threshold logic, scoring, decisions
│   ├── file-detector.js         ← MIME type detection, routing
│   └── utils.js                 ← helpers (base64, cleanup, logging)
├── queues/
│   └── human-review-queue.js    ← flagged content queue handler
├── tests/
│   ├── test-image.js
│   ├── test-gif.js
│   └── test-video.js
└── tmp/                         ← temp frame storage (auto-cleaned)
```

---

## Implementation

### src/file-detector.js

```javascript
export function detectFileType(mimeType) {
  if (mimeType.startsWith("image/gif")) return "gif";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  throw new Error(`Unsupported MIME type: ${mimeType}`);
}

export function getMediaType(mimeType) {
  const map = {
    "image/jpeg": "image/jpeg",
    "image/png":  "image/png",
    "image/webp": "image/webp",
    "image/gif":  "image/jpeg", // extracted frames are JPEG
  };
  return map[mimeType] || "image/jpeg";
}
```

---

### src/frame-extractor.js

```javascript
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Extract frames from a GIF or video buffer using ffmpeg.
 * 
 * @param {Buffer} inputBuffer - raw file buffer
 * @param {string} inputPath   - temp file path written before calling
 * @param {Object} options
 * @param {number} [options.frameCount]  - fixed number of frames (GIF)
 * @param {number} [options.interval]    - seconds between frames (video)
 * @param {number} [options.maxFrames]   - hard cap on frame count
 * @returns {Promise<Buffer[]>} array of JPEG frame buffers
 */
export async function extractFrames(inputPath, options = {}) {
  const {
    frameCount,
    interval = 2,
    maxFrames = parseInt(process.env.VIDEO_MAX_FRAMES || "30")
  } = options;

  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "frames-"));

  return new Promise((resolve, reject) => {
    const cmd = ffmpeg(inputPath);

    if (frameCount) {
      // GIF: extract fixed number of evenly-spaced frames
      cmd.outputOptions([`-vf select='not(mod(n\\,2))'`, `-frames:v ${frameCount}`]);
    } else {
      // Video: 1 frame every N seconds
      cmd.outputOptions([`-vf fps=1/${interval}`, `-frames:v ${maxFrames}`]);
    }

    cmd
      .output(path.join(outputDir, "frame-%03d.jpg"))
      .on("end", () => {
        const files = fs.readdirSync(outputDir)
          .filter(f => f.endsWith(".jpg"))
          .sort();

        const buffers = files.map(f =>
          fs.readFileSync(path.join(outputDir, f))
        );

        // Cleanup temp dir
        files.forEach(f => fs.unlinkSync(path.join(outputDir, f)));
        fs.rmdirSync(outputDir);

        resolve(buffers);
      })
      .on("error", (err) => {
        reject(new Error(`ffmpeg error: ${err.message}`));
      })
      .run();
  });
}

/**
 * Write buffer to a temp file (needed for ffmpeg input).
 * Returns the temp file path — caller must delete after use.
 */
export function writeTempFile(buffer, ext = ".mp4") {
  const tmpPath = path.join(os.tmpdir(), `upload-${Date.now()}${ext}`);
  fs.writeFileSync(tmpPath, buffer);
  return tmpPath;
}

export function cleanupTempFile(filePath) {
  try { fs.unlinkSync(filePath); } catch (_) {}
}
```

---

### src/google-vision.js

```javascript
import { ImageAnnotatorClient } from "@google-cloud/vision";

const visionClient = new ImageAnnotatorClient();

// Google's likelihood enum → numeric score
const LIKELIHOOD_SCORE = {
  "UNKNOWN":       0,
  "VERY_UNLIKELY": 0.05,
  "UNLIKELY":      0.25,
  "POSSIBLE":      0.50,
  "LIKELY":        0.75,
  "VERY_LIKELY":   0.95
};

/**
 * Run SafeSearch detection on a single image buffer.
 * @param {Buffer} imageBuffer
 * @returns {Promise<Object>} { scores, rawAnnotation }
 */
export async function analyzeImage(imageBuffer) {
  const [result] = await visionClient.safeSearchDetection({
    image: { content: imageBuffer.toString("base64") }
  });

  const s = result.safeSearchAnnotation;

  const scores = {
    adult:    LIKELIHOOD_SCORE[s.adult]    ?? 0,
    violence: LIKELIHOOD_SCORE[s.violence] ?? 0,
    racy:     LIKELIHOOD_SCORE[s.racy]     ?? 0,
    medical:  LIKELIHOOD_SCORE[s.medical]  ?? 0,
    spoof:    LIKELIHOOD_SCORE[s.spoof]    ?? 0,
  };

  return { scores, rawAnnotation: s };
}

/**
 * Analyze multiple frames in parallel (GIF / video).
 * Returns per-frame results + aggregated worst-case scores.
 * @param {Buffer[]} frames
 * @returns {Promise<Object>}
 */
export async function analyzeFrames(frames) {
  const results = await Promise.all(frames.map(analyzeImage));

  // Worst frame = highest score across all frames
  const worstScores = {
    adult:    Math.max(...results.map(r => r.scores.adult)),
    violence: Math.max(...results.map(r => r.scores.violence)),
    racy:     Math.max(...results.map(r => r.scores.racy)),
    medical:  Math.max(...results.map(r => r.scores.medical)),
    spoof:    Math.max(...results.map(r => r.scores.spoof)),
  };

  // Find the actual worst frame buffer index for Claude escalation
  const worstFrameIndex = results.reduce((worstIdx, r, i) => {
    const score = Math.max(r.scores.adult, r.scores.violence, r.scores.racy);
    const worstScore = Math.max(
      results[worstIdx].scores.adult,
      results[worstIdx].scores.violence,
      results[worstIdx].scores.racy
    );
    return score > worstScore ? i : worstIdx;
  }, 0);

  return {
    perFrame: results,
    worstScores,
    worstFrameIndex,
    totalFrames: frames.length,
    flaggedFrameCount: results.filter(r =>
      r.scores.adult >= 0.50 || r.scores.violence >= 0.50
    ).length
  };
}
```

---

### src/decision-engine.js

```javascript
const THRESHOLDS = {
  block: {
    adult:    parseFloat(process.env.THRESHOLD_BLOCK_ADULT    || "0.75"),
    violence: parseFloat(process.env.THRESHOLD_BLOCK_VIOLENCE || "0.75"),
    racy:     parseFloat(process.env.THRESHOLD_BLOCK_RACY     || "0.95"),
  },
  review: {
    adult:    parseFloat(process.env.THRESHOLD_REVIEW_ADULT    || "0.50"),
    violence: parseFloat(process.env.THRESHOLD_REVIEW_VIOLENCE || "0.50"),
    racy:     parseFloat(process.env.THRESHOLD_REVIEW_RACY     || "0.75"),
  }
};

/**
 * Given Google Vision scores, return a decision:
 * "block" | "review" | "allow"
 */
export function makeDecision(scores) {
  const { adult, violence, racy } = scores;

  if (
    adult    >= THRESHOLDS.block.adult    ||
    violence >= THRESHOLDS.block.violence ||
    racy     >= THRESHOLDS.block.racy
  ) {
    return {
      decision: "block",
      scores,
      reason: `Google Vision: exceeds block threshold — adult:${adult} violence:${violence} racy:${racy}`
    };
  }

  if (
    adult    >= THRESHOLDS.review.adult    ||
    violence >= THRESHOLDS.review.violence ||
    racy     >= THRESHOLDS.review.racy
  ) {
    return {
      decision: "review",
      scores,
      reason: `Google Vision: gray zone — escalating to Claude`
    };
  }

  return {
    decision: "allow",
    scores,
    reason: "Google Vision: all scores within safe range"
  };
}
```

---

### src/claude-vertex.js

```javascript
import { AnthropicVertex } from "@anthropic-ai/vertex-sdk";

const client = new AnthropicVertex({
  region:  process.env.VERTEX_AI_REGION  || "us-east5",
  projectId: process.env.VERTEX_AI_PROJECT || "dazzling-spirit-426406-m4",
});

const MODEL = process.env.VERTEX_AI_MODEL || "claude-sonnet-4-5";

/**
 * Secondary moderation check via Claude on Vertex AI.
 * Called ONLY for gray zone content (Google Vision uncertain).
 *
 * @param {Buffer}  imageBuffer   - worst flagged frame (JPEG)
 * @param {Object}  googleScores  - scores from Google Vision
 * @param {string}  sourceType    - "image" | "gif" | "video"
 * @param {Object}  [meta]        - optional: frameIndex, totalFrames, flaggedFrames
 * @returns {Promise<Object>} { action, confidence, reason, safe }
 */
export async function claudeSecondaryCheck(imageBuffer, googleScores, sourceType, meta = {}) {
  const base64 = imageBuffer.toString("base64");

  const contextNote = sourceType !== "image"
    ? `This is frame ${meta.frameIndex + 1} of ${meta.totalFrames} from a ${sourceType}. ` +
      `${meta.flaggedFrames} frame(s) were flagged by Google Vision.`
    : "This is a single image.";

  const systemPrompt = `You are a strict content moderator for a student education platform serving children aged 6–18.
Google Cloud Vision flagged this content as uncertain with these scores:
- Adult: ${googleScores.adult}
- Violence: ${googleScores.violence}
- Racy: ${googleScores.racy}

${contextNote}

Analyze the image carefully considering context. A medical diagram is not inappropriate. 
A cartoon fight in an educational game is not the same as graphic violence.
However, be strict — when in doubt, flag for human review.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation outside JSON):
{
  "safe": true | false,
  "confidence": 0.0 to 1.0,
  "action": "allow" | "flag" | "block",
  "categories": {
    "nudity": 0.0 to 1.0,
    "violence": 0.0 to 1.0,
    "hate_symbols": 0.0 to 1.0,
    "weapons": 0.0 to 1.0,
    "drugs": 0.0 to 1.0
  },
  "reason": "one sentence explanation"
}`;

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: base64
            }
          },
          {
            type: "text",
            text: `Make the final moderation decision for this ${sourceType}.`
          }
        ]
      }]
    });
  } catch (err) {
    console.error("Claude Vertex API error:", err.message);
    // Fail safe: flag for human review on API error
    return {
      safe: false,
      confidence: 0,
      action: "flag",
      reason: `Claude API error — flagged for human review: ${err.message}`,
      categories: {}
    };
  }

  const rawText = response.content?.[0]?.text || "";

  try {
    const clean = rawText.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    console.error("Claude response parse error. Raw:", rawText);
    return {
      safe: false,
      confidence: 0,
      action: "flag",
      reason: "Claude response malformed — flagged for human review"
    };
  }
}
```

---

### src/orchestrator.js

```javascript
import { detectFileType, getMediaType } from "./file-detector.js";
import { analyzeImage, analyzeFrames } from "./google-vision.js";
import { claudeSecondaryCheck } from "./claude-vertex.js";
import { makeDecision } from "./decision-engine.js";
import { extractFrames, writeTempFile, cleanupTempFile } from "./frame-extractor.js";
import { addToHumanReviewQueue } from "../queues/human-review-queue.js";
import path from "path";

/**
 * Master moderation orchestrator.
 * 
 * @param {Buffer} fileBuffer
 * @param {string} mimeType
 * @param {Object} [meta]         - optional metadata (userId, uploadId, etc.)
 * @returns {Promise<Object>}     - final moderation result
 */
export async function runModeration(fileBuffer, mimeType, meta = {}) {
  const startTime = Date.now();
  const fileType = detectFileType(mimeType);

  let googleResult;
  let frames = [];
  let tmpPath = null;

  try {
    // ─── GOOGLE VISION LAYER ─────────────────────────────────────────────

    if (fileType === "image") {
      const { scores } = await analyzeImage(fileBuffer);
      googleResult = { ...makeDecision(scores), sourceType: "image" };

    } else if (fileType === "gif") {
      const ext = ".gif";
      tmpPath = writeTempFile(fileBuffer, ext);
      frames = await extractFrames(tmpPath, {
        frameCount: parseInt(process.env.GIF_FRAME_COUNT || "6")
      });
      const frameAnalysis = await analyzeFrames(frames);
      googleResult = {
        ...makeDecision(frameAnalysis.worstScores),
        sourceType: "gif",
        ...frameAnalysis
      };

    } else if (fileType === "video") {
      const ext = path.extname(mimeType.split("/")[1]) || ".mp4";
      tmpPath = writeTempFile(fileBuffer, `.${ext}`);
      frames = await extractFrames(tmpPath, {
        interval: parseInt(process.env.VIDEO_FRAME_INTERVAL_SECONDS || "2"),
        maxFrames: parseInt(process.env.VIDEO_MAX_FRAMES || "30")
      });
      const frameAnalysis = await analyzeFrames(frames);
      googleResult = {
        ...makeDecision(frameAnalysis.worstScores),
        sourceType: "video",
        ...frameAnalysis
      };
    }

  } finally {
    if (tmpPath) cleanupTempFile(tmpPath);
  }

  const latencyGoogle = Date.now() - startTime;

  // ─── FAST PATH: Hard block or clear allow ────────────────────────────

  if (googleResult.decision === "block") {
    return buildResult("block", "google_vision", googleResult, null, latencyGoogle, meta);
  }

  if (googleResult.decision === "allow") {
    return buildResult("allow", "google_vision", googleResult, null, latencyGoogle, meta);
  }

  // ─── GRAY ZONE: Escalate to Claude ───────────────────────────────────

  console.log(`[moderation] Gray zone detected (${googleResult.sourceType}), escalating to Claude...`);

  // Pick worst frame for Claude (for GIF/video)
  const frameForClaude = frames.length > 0
    ? frames[googleResult.worstFrameIndex || 0]
    : fileBuffer;

  const claudeStart = Date.now();
  const claudeResult = await claudeSecondaryCheck(
    frameForClaude,
    googleResult.worstScores || googleResult.scores,
    googleResult.sourceType,
    {
      frameIndex:     googleResult.worstFrameIndex || 0,
      totalFrames:    googleResult.totalFrames || 1,
      flaggedFrames:  googleResult.flaggedFrameCount || 0
    }
  );
  const latencyClaude = Date.now() - claudeStart;

  const finalResult = buildResult(
    claudeResult.action,
    "claude_vertex",
    googleResult,
    claudeResult,
    latencyGoogle,
    meta,
    latencyClaude
  );

  // Push flagged content to human review queue
  if (claudeResult.action === "flag") {
    await addToHumanReviewQueue({
      ...finalResult,
      uploadMeta: meta
    });
  }

  return finalResult;
}

function buildResult(decision, layer, googleResult, claudeResult, latencyGoogle, meta, latencyClaude = 0) {
  return {
    finalDecision: decision,           // "allow" | "flag" | "block"
    layer,                             // which layer made final call
    sourceType: googleResult.sourceType,
    googleScores: googleResult.worstScores || googleResult.scores,
    googleReason: googleResult.reason,
    claude: claudeResult ? {
      action:     claudeResult.action,
      confidence: claudeResult.confidence,
      reason:     claudeResult.reason,
      categories: claudeResult.categories,
    } : null,
    performance: {
      googleMs: latencyGoogle,
      claudeMs: latencyClaude,
      totalMs:  latencyGoogle + latencyClaude,
    },
    meta,
    timestamp: new Date().toISOString(),
  };
}
```

---

### src/index.js (Express Route)

```javascript
import express from "express";
import multer from "multer";
import { runModeration } from "./orchestrator.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime"
];

app.post("/moderate", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
    return res.status(415).json({ error: `Unsupported file type: ${req.file.mimetype}` });
  }

  try {
    const result = await runModeration(
      req.file.buffer,
      req.file.mimetype,
      {
        uploadId: req.headers["x-upload-id"],
        userId:   req.headers["x-user-id"],
        filename: req.file.originalname
      }
    );

    const statusCode = result.finalDecision === "allow" ? 200 : 422;
    return res.status(statusCode).json(result);

  } catch (err) {
    console.error("[moderation] Fatal error:", err);
    return res.status(500).json({ error: "Moderation service error", detail: err.message });
  }
});

app.listen(3000, () => console.log("Moderation service running on :3000"));
```

---

## Decision Flow Summary

| Google Score | Decision | Claude Called? | Cost |
|---|---|---|---|
| > 0.75 (any category) | ❌ BLOCK | No | Cheapest |
| < 0.50 (all categories) | ✅ ALLOW | No | Cheapest |
| 0.50 – 0.75 (gray zone) | Claude decides | Yes | Higher |
| Claude says "flag" | ⚠️ HUMAN REVIEW | — | Queue |

---

## Cost Estimates

| Volume | Google Vision | Claude Vertex (~15% escalation) | Total |
|---|---|---|---|
| 1,000 images | $1.50 | ~$0.30 | **~$1.80** |
| 10,000 images | $15.00 | ~$3.00 | **~$18.00** |
| 1 min video (30 frames) | $0.045 | ~$0.10 if escalated | **~$0.15** |
| 5 min video (150 frames) | $0.225 | ~$0.10 if escalated | **~$0.33** |

> Claude on Vertex AI pricing follows Google Cloud billing — no separate Anthropic credit needed.

---

## What Claude Code Can Improve / Build Out

Claude Code can autonomously implement the following improvements when asked:

### 1. Hash-Based Caching Layer
- Before calling Google Vision, compute `sha256(fileBuffer)`
- Check Redis/Upstash for a cached moderation result
- If found, return cached result instantly (zero API cost for re-uploads)
- Implementation: add `src/cache.js` using `ioredis` or Upstash REST API

### 2. Admin Dashboard (React + Express)
- Real-time feed of flagged/blocked content with thumbnails
- Human review queue with approve/reject buttons
- Charts: moderation breakdown by day, category, file type
- Threshold tuning UI (sliders for block/review thresholds with live preview)

### 3. Webhook Support
- After moderation completes, POST result to a configured webhook URL
- Useful for integrating with main app (Robomaniac platform, etc.)
- Add retry logic with exponential backoff

### 4. Video Thumbnail Extraction
- For flagged videos: extract a 3x3 grid of frames as a single preview image
- Store in Azure Blob / GCP Storage for human reviewers to see at a glance

### 5. Audio Moderation for Videos
- Extract audio track using ffmpeg
- Transcribe using Google Speech-to-Text or Whisper
- Run transcription through Claude text moderation
- Combine audio + visual scores for final video decision

### 6. Batch Moderation Endpoint
- `POST /moderate/batch` accepting up to 50 files
- Process Google Vision in parallel batches
- Return aggregate results with per-file decisions

### 7. Confidence Score Calibration
- Log all moderation decisions to PostgreSQL
- When human reviewer overrides a decision, record it
- Use override data to auto-tune thresholds over time
- Build a simple calibration script: `npm run calibrate`

### 8. Rate Limiting & Abuse Protection
- Per-user upload rate limits (e.g., 100 uploads/hour)
- File size validation per type (images ≤ 10MB, videos ≤ 500MB)
- Duplicate upload detection via hash

### 9. Streaming Video Support
- Instead of downloading full video before moderating, stream chunks
- Extract frames from first 30s immediately, start moderation early
- Flag and abort upload if first batch is already clearly violating

### 10. Docker + CI/CD
- Multi-stage Dockerfile for production build
- GitHub Actions workflow: test → build → push to GCR → deploy to Cloud Run
- Health check endpoint `GET /health` returning service status + API connectivity

---

## Running Locally

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Fill in GOOGLE_APPLICATION_CREDENTIALS, VERTEX_AI_PROJECT, etc.

# Run dev server
npm run dev

# Test with a sample image
curl -X POST http://localhost:3000/moderate \
  -F "file=@./tests/sample.jpg" \
  -H "x-user-id: user123"
```

---

## Known Limitations

- **GIF context**: Frame-by-frame analysis may miss context that spans frames (e.g., a kiss that starts innocent). Improvement: send 3 frames together to Claude instead of worst single frame.
- **Video audio**: Current implementation is visual-only. Add audio transcription for complete video moderation.
- **Long videos**: Capped at 30 frames (1 frame/2s = 60s of video). Videos longer than that need chunked processing.
- **Non-English text in images**: Google Vision OCR + Claude can read text inside images, but this is not currently implemented. Add `TEXT_DETECTION` feature to Vision call for images containing text overlays.
- **Animated WebP**: Treated as static image currently. Add animated WebP detection and frame extraction.
- **Cold start latency**: If running on Cloud Run with scale-to-zero, first request may be slow. Use minimum instances = 1 for production.

---

## Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/vertex-sdk": "^0.5.0",
    "@google-cloud/vision": "^4.3.2",
    "express": "^4.18.2",
    "fluent-ffmpeg": "^2.1.3",
    "multer": "^1.4.5",
    "sharp": "^0.33.4"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

> ffmpeg must be installed on the system: `apt-get install ffmpeg` (Linux) or `brew install ffmpeg` (Mac)