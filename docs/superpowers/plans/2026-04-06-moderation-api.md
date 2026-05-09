# Content Moderation API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready plug-and-play content moderation API that accepts images, GIFs, and videos, runs them through Google Vision + Claude on Vertex AI, and returns a moderation decision.

**Architecture:** File → type detection → frame extraction (GIF/video) → Google Vision SafeSearch (parallel) → threshold decision engine → Claude secondary check (gray zone ~15%) → human review queue (flagged). API key middleware wraps the Express server so end-users can consume this as a SaaS.

**Tech Stack:** Node.js (ESM), Express, Multer, fluent-ffmpeg, sharp, @google-cloud/vision, @anthropic-ai/vertex-sdk, BullMQ + ioredis (human review queue), dotenv

---

## File Map

| File | Responsibility |
|---|---|
| `package.json` | Dependencies and scripts |
| `.env.example` | Template for all required env vars |
| `src/file-detector.js` | MIME type detection and routing |
| `src/utils.js` | Base64 helpers, logger, temp file cleanup |
| `src/frame-extractor.js` | ffmpeg frame extraction for GIF/video |
| `src/google-vision.js` | Google Vision SafeSearch wrapper |
| `src/decision-engine.js` | Threshold logic: block / review / allow |
| `src/claude-vertex.js` | Claude on Vertex AI secondary check |
| `src/orchestrator.js` | Master moderation flow controller |
| `src/api-key-middleware.js` | Per-user API key validation (plug-and-play) |
| `src/index.js` | Express server, `/moderate` route, `/health` |
| `queues/human-review-queue.js` | BullMQ queue for flagged content |
| `tests/test-image.js` | Integration test: image moderation |
| `tests/test-gif.js` | Integration test: GIF moderation |
| `tests/test-video.js` | Integration test: video moderation |

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "mod-me",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test:image": "node tests/test-image.js",
    "test:gif": "node tests/test-gif.js",
    "test:video": "node tests/test-video.js"
  },
  "dependencies": {
    "@anthropic-ai/vertex-sdk": "^0.5.0",
    "@google-cloud/vision": "^4.3.2",
    "bullmq": "^5.7.0",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "fluent-ffmpeg": "^2.1.3",
    "ioredis": "^5.3.2",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.4",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

- [ ] **Step 2: Write `.env.example`**

```env
# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
GOOGLE_CLOUD_PROJECT=your-gcp-project-id

# Vertex AI (Claude)
VERTEX_AI_REGION=us-east5
VERTEX_AI_PROJECT=your-vertex-project-id
VERTEX_AI_MODEL=claude-sonnet-4-5

# Moderation thresholds
THRESHOLD_BLOCK_ADULT=0.75
THRESHOLD_BLOCK_VIOLENCE=0.75
THRESHOLD_BLOCK_RACY=0.95
THRESHOLD_REVIEW_ADULT=0.50
THRESHOLD_REVIEW_VIOLENCE=0.50
THRESHOLD_REVIEW_RACY=0.75

# GIF/Video sampling
GIF_FRAME_COUNT=6
VIDEO_FRAME_INTERVAL_SECONDS=2
VIDEO_MAX_FRAMES=30

# API key store (comma-separated valid API keys, or use Redis)
VALID_API_KEYS=key1,key2,key3

# Redis (BullMQ)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Server
PORT=3000
```

- [ ] **Step 3: Write `.gitignore`**

```
node_modules/
.env
service-account.json
tmp/
*.log
```

- [ ] **Step 4: Install dependencies**

```bash
npm install
```

Expected output: `added N packages` with no errors.

- [ ] **Step 5: Create temp directory**

```bash
mkdir -p tmp
echo "# auto-generated temp files" > tmp/.gitkeep
```

- [ ] **Step 6: Commit**

```bash
git init
git add package.json .env.example .gitignore tmp/.gitkeep
git commit -m "feat: project scaffolding"
```

---

## Task 2: `src/file-detector.js`

**Files:**
- Create: `src/file-detector.js`

- [ ] **Step 1: Create the file**

```javascript
// src/file-detector.js

/**
 * Detect high-level media type from MIME type string.
 * @param {string} mimeType
 * @returns {"image" | "gif" | "video"}
 */
export function detectFileType(mimeType) {
  if (mimeType === "image/gif") return "gif";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  throw new Error(`Unsupported MIME type: ${mimeType}`);
}

/**
 * Map MIME type to the media_type string expected by Claude/Vision APIs.
 * Extracted frames from GIFs and videos are always returned as JPEG.
 * @param {string} mimeType
 * @returns {string}
 */
export function getMediaType(mimeType) {
  const map = {
    "image/jpeg": "image/jpeg",
    "image/png":  "image/png",
    "image/webp": "image/webp",
    "image/gif":  "image/jpeg",
  };
  return map[mimeType] || "image/jpeg";
}
```

- [ ] **Step 2: Manually verify logic is correct**

Run in node REPL:
```bash
node --input-type=module <<'EOF'
import { detectFileType } from "./src/file-detector.js";
console.assert(detectFileType("image/jpeg") === "image");
console.assert(detectFileType("image/gif") === "gif");
console.assert(detectFileType("video/mp4") === "video");
console.log("file-detector OK");
EOF
```

Expected: `file-detector OK`

- [ ] **Step 3: Commit**

```bash
git add src/file-detector.js
git commit -m "feat: add file-detector module"
```

---

## Task 3: `src/utils.js`

**Files:**
- Create: `src/utils.js`

- [ ] **Step 1: Create the file**

```javascript
// src/utils.js
import fs from "fs";

/**
 * Convert a Buffer to a base64 string.
 * @param {Buffer} buffer
 * @returns {string}
 */
export function toBase64(buffer) {
  return buffer.toString("base64");
}

/**
 * Structured logger with ISO timestamp.
 */
export const logger = {
  info:  (msg, data = {}) => console.log(JSON.stringify({ level: "info",  msg, ...data, ts: new Date().toISOString() })),
  warn:  (msg, data = {}) => console.warn(JSON.stringify({ level: "warn",  msg, ...data, ts: new Date().toISOString() })),
  error: (msg, data = {}) => console.error(JSON.stringify({ level: "error", msg, ...data, ts: new Date().toISOString() })),
};

/**
 * Delete a file silently (no-op if it doesn't exist).
 * @param {string} filePath
 */
export function silentUnlink(filePath) {
  try { fs.unlinkSync(filePath); } catch (_) {}
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils.js
git commit -m "feat: add utils module"
```

---

## Task 4: `src/frame-extractor.js`

**Files:**
- Create: `src/frame-extractor.js`

**Prerequisite:** `ffmpeg` must be installed on the system.
- Mac: `brew install ffmpeg`
- Linux: `apt-get install ffmpeg`
- Verify: `ffmpeg -version`

- [ ] **Step 1: Create the file**

```javascript
// src/frame-extractor.js
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";
import { silentUnlink } from "./utils.js";

/**
 * Extract frames from a GIF or video file path using ffmpeg.
 *
 * @param {string} inputPath   - path to the temp file on disk
 * @param {Object} options
 * @param {number} [options.frameCount]  - fixed number of evenly-spaced frames (GIF mode)
 * @param {number} [options.interval]    - seconds between frames (video mode)
 * @param {number} [options.maxFrames]   - hard cap on extracted frames
 * @returns {Promise<Buffer[]>}          - array of JPEG frame buffers
 */
export async function extractFrames(inputPath, options = {}) {
  const {
    frameCount,
    interval = 2,
    maxFrames = parseInt(process.env.VIDEO_MAX_FRAMES || "30"),
  } = options;

  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "mod-frames-"));

  return new Promise((resolve, reject) => {
    const cmd = ffmpeg(inputPath);

    if (frameCount) {
      // GIF: select every Nth frame to get ~frameCount frames
      cmd.outputOptions([
        `-vf select='not(mod(n\\,2))'`,
        `-frames:v ${frameCount}`,
      ]);
    } else {
      // Video: 1 frame every `interval` seconds, capped at maxFrames
      cmd.outputOptions([`-vf fps=1/${interval}`, `-frames:v ${maxFrames}`]);
    }

    cmd
      .output(path.join(outputDir, "frame-%03d.jpg"))
      .on("end", () => {
        const files = fs
          .readdirSync(outputDir)
          .filter((f) => f.endsWith(".jpg"))
          .sort();

        const buffers = files.map((f) =>
          fs.readFileSync(path.join(outputDir, f))
        );

        // Cleanup temp frames dir
        files.forEach((f) => silentUnlink(path.join(outputDir, f)));
        try { fs.rmdirSync(outputDir); } catch (_) {}

        resolve(buffers);
      })
      .on("error", (err) => {
        reject(new Error(`ffmpeg error: ${err.message}`));
      })
      .run();
  });
}

/**
 * Write a buffer to a temp file so ffmpeg can read it.
 * Caller MUST call cleanupTempFile() after use.
 *
 * @param {Buffer} buffer
 * @param {string} ext    - e.g. ".gif", ".mp4"
 * @returns {string}      - absolute path to temp file
 */
export function writeTempFile(buffer, ext = ".mp4") {
  const tmpPath = path.join(os.tmpdir(), `mod-upload-${Date.now()}${ext}`);
  fs.writeFileSync(tmpPath, buffer);
  return tmpPath;
}

/**
 * Delete a temp file silently.
 * @param {string} filePath
 */
export function cleanupTempFile(filePath) {
  silentUnlink(filePath);
}
```

- [ ] **Step 2: Verify ffmpeg is installed**

```bash
ffmpeg -version
```

Expected: version info printed. If missing, install it first.

- [ ] **Step 3: Commit**

```bash
git add src/frame-extractor.js
git commit -m "feat: add frame-extractor module"
```

---

## Task 5: `src/google-vision.js`

**Files:**
- Create: `src/google-vision.js`

**Prerequisite:** `GOOGLE_APPLICATION_CREDENTIALS` env var must point to a valid service-account.json.

- [ ] **Step 1: Create the file**

```javascript
// src/google-vision.js
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { logger } from "./utils.js";

const visionClient = new ImageAnnotatorClient();

// Google's ordinal likelihood enum → numeric score
const LIKELIHOOD_SCORE = {
  UNKNOWN:       0,
  VERY_UNLIKELY: 0.05,
  UNLIKELY:      0.25,
  POSSIBLE:      0.50,
  LIKELY:        0.75,
  VERY_LIKELY:   0.95,
};

/**
 * Run SafeSearch detection on a single JPEG/PNG/WebP buffer.
 *
 * @param {Buffer} imageBuffer
 * @returns {Promise<{ scores: Object, rawAnnotation: Object }>}
 */
export async function analyzeImage(imageBuffer) {
  const [result] = await visionClient.safeSearchDetection({
    image: { content: imageBuffer.toString("base64") },
  });

  const s = result.safeSearchAnnotation;

  const scores = {
    adult:    LIKELIHOOD_SCORE[s.adult]    ?? 0,
    violence: LIKELIHOOD_SCORE[s.violence] ?? 0,
    racy:     LIKELIHOOD_SCORE[s.racy]     ?? 0,
    medical:  LIKELIHOOD_SCORE[s.medical]  ?? 0,
    spoof:    LIKELIHOOD_SCORE[s.spoof]    ?? 0,
  };

  logger.info("Google Vision result", { scores });
  return { scores, rawAnnotation: s };
}

/**
 * Analyze multiple frames in parallel (GIF / video).
 * Returns per-frame results and aggregated worst-case scores.
 *
 * @param {Buffer[]} frames
 * @returns {Promise<Object>}
 */
export async function analyzeFrames(frames) {
  const results = await Promise.all(frames.map(analyzeImage));

  const worstScores = {
    adult:    Math.max(...results.map((r) => r.scores.adult)),
    violence: Math.max(...results.map((r) => r.scores.violence)),
    racy:     Math.max(...results.map((r) => r.scores.racy)),
    medical:  Math.max(...results.map((r) => r.scores.medical)),
    spoof:    Math.max(...results.map((r) => r.scores.spoof)),
  };

  // Index of the frame with the highest combined adult+violence+racy score
  const worstFrameIndex = results.reduce((worstIdx, r, i) => {
    const score = r.scores.adult + r.scores.violence + r.scores.racy;
    const worstScore =
      results[worstIdx].scores.adult +
      results[worstIdx].scores.violence +
      results[worstIdx].scores.racy;
    return score > worstScore ? i : worstIdx;
  }, 0);

  return {
    perFrame: results,
    worstScores,
    worstFrameIndex,
    totalFrames: frames.length,
    flaggedFrameCount: results.filter(
      (r) => r.scores.adult >= 0.5 || r.scores.violence >= 0.5
    ).length,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/google-vision.js
git commit -m "feat: add google-vision module"
```

---

## Task 6: `src/decision-engine.js`

**Files:**
- Create: `src/decision-engine.js`

- [ ] **Step 1: Create the file**

```javascript
// src/decision-engine.js
import "dotenv/config";

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
  },
};

/**
 * Given Google Vision scores, return a decision object.
 *
 * @param {{ adult: number, violence: number, racy: number }} scores
 * @returns {{ decision: "block"|"review"|"allow", scores: Object, reason: string }}
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
      reason: `Google Vision: exceeds block threshold — adult:${adult} violence:${violence} racy:${racy}`,
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
      reason: "Google Vision: gray zone — escalating to Claude",
    };
  }

  return {
    decision: "allow",
    scores,
    reason: "Google Vision: all scores within safe range",
  };
}
```

- [ ] **Step 2: Verify thresholds inline test**

```bash
node --input-type=module <<'EOF'
import "dotenv/config";
import { makeDecision } from "./src/decision-engine.js";

const r1 = makeDecision({ adult: 0.95, violence: 0, racy: 0 });
console.assert(r1.decision === "block", "should block high adult");

const r2 = makeDecision({ adult: 0.1, violence: 0.1, racy: 0.1 });
console.assert(r2.decision === "allow", "should allow low scores");

const r3 = makeDecision({ adult: 0.5, violence: 0, racy: 0 });
console.assert(r3.decision === "review", "should escalate gray zone");

console.log("decision-engine OK");
EOF
```

Expected: `decision-engine OK`

- [ ] **Step 3: Commit**

```bash
git add src/decision-engine.js
git commit -m "feat: add decision-engine module"
```

---

## Task 7: `src/claude-vertex.js`

**Files:**
- Create: `src/claude-vertex.js`

**Prerequisite:** `VERTEX_AI_PROJECT` and `VERTEX_AI_REGION` env vars must be set. Google Cloud credentials must have Vertex AI access.

- [ ] **Step 1: Create the file**

```javascript
// src/claude-vertex.js
import { AnthropicVertex } from "@anthropic-ai/vertex-sdk";
import { logger } from "./utils.js";

const client = new AnthropicVertex({
  region:    process.env.VERTEX_AI_REGION    || "us-east5",
  projectId: process.env.VERTEX_AI_PROJECT   || "your-project-id",
});

const MODEL = process.env.VERTEX_AI_MODEL || "claude-sonnet-4-5";

/**
 * Secondary moderation via Claude on Vertex AI.
 * Called ONLY for gray-zone content (~15% of uploads).
 *
 * @param {Buffer}  imageBuffer   - worst flagged frame (JPEG)
 * @param {Object}  googleScores  - { adult, violence, racy } from Google Vision
 * @param {string}  sourceType    - "image" | "gif" | "video"
 * @param {Object}  [meta]        - { frameIndex, totalFrames, flaggedFrames }
 * @returns {Promise<{ action: string, confidence: number, reason: string, safe: boolean, categories: Object }>}
 */
export async function claudeSecondaryCheck(imageBuffer, googleScores, sourceType, meta = {}) {
  const base64 = imageBuffer.toString("base64");

  const contextNote =
    sourceType !== "image"
      ? `This is frame ${(meta.frameIndex || 0) + 1} of ${meta.totalFrames || 1} from a ${sourceType}. ` +
        `${meta.flaggedFrames || 0} frame(s) were flagged by Google Vision.`
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
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: base64 },
            },
            {
              type: "text",
              text: `Make the final moderation decision for this ${sourceType}.`,
            },
          ],
        },
      ],
    });
  } catch (err) {
    logger.error("Claude Vertex API error", { error: err.message });
    // Fail safe: flag for human review on any API error
    return {
      safe: false,
      confidence: 0,
      action: "flag",
      reason: `Claude API error — flagged for human review: ${err.message}`,
      categories: {},
    };
  }

  const rawText = response.content?.[0]?.text || "";

  try {
    const clean = rawText.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    logger.error("Claude response parse error", { rawText });
    return {
      safe: false,
      confidence: 0,
      action: "flag",
      reason: "Claude response malformed — flagged for human review",
      categories: {},
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/claude-vertex.js
git commit -m "feat: add claude-vertex module"
```

---

## Task 8: `queues/human-review-queue.js`

**Files:**
- Create: `queues/human-review-queue.js`

**Prerequisite:** Redis must be running locally (`brew install redis && brew services start redis` on Mac, or `apt install redis-server` on Linux).

- [ ] **Step 1: Create the file**

```javascript
// queues/human-review-queue.js
import { Queue } from "bullmq";
import { logger } from "../src/utils.js";

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

const reviewQueue = new Queue("human-review", { connection });

/**
 * Add a flagged moderation result to the human review queue.
 *
 * @param {Object} moderationResult - final result object from orchestrator
 * @returns {Promise<void>}
 */
export async function addToHumanReviewQueue(moderationResult) {
  await reviewQueue.add("review-item", moderationResult, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
  logger.info("Added to human review queue", {
    uploadId: moderationResult.meta?.uploadId,
    finalDecision: moderationResult.finalDecision,
  });
}
```

- [ ] **Step 2: Verify Redis is running**

```bash
redis-cli ping
```

Expected: `PONG`

- [ ] **Step 3: Commit**

```bash
git add queues/human-review-queue.js
git commit -m "feat: add human-review-queue module"
```

---

## Task 9: `src/orchestrator.js`

**Files:**
- Create: `src/orchestrator.js`

- [ ] **Step 1: Create the file**

```javascript
// src/orchestrator.js
import path from "path";
import { detectFileType } from "./file-detector.js";
import { analyzeImage, analyzeFrames } from "./google-vision.js";
import { claudeSecondaryCheck } from "./claude-vertex.js";
import { makeDecision } from "./decision-engine.js";
import { extractFrames, writeTempFile, cleanupTempFile } from "./frame-extractor.js";
import { addToHumanReviewQueue } from "../queues/human-review-queue.js";
import { logger } from "./utils.js";

/**
 * Master moderation orchestrator.
 *
 * @param {Buffer} fileBuffer
 * @param {string} mimeType
 * @param {Object} [meta]      - optional metadata (userId, uploadId, filename, etc.)
 * @returns {Promise<Object>}  - final moderation result
 */
export async function runModeration(fileBuffer, mimeType, meta = {}) {
  const startTime = Date.now();
  const fileType = detectFileType(mimeType);
  logger.info("Moderation started", { fileType, mimeType, meta });

  let googleResult;
  let frames = [];
  let tmpPath = null;

  try {
    // ── GOOGLE VISION LAYER ──────────────────────────────────────────
    if (fileType === "image") {
      const { scores } = await analyzeImage(fileBuffer);
      googleResult = { ...makeDecision(scores), scores, sourceType: "image" };

    } else if (fileType === "gif") {
      tmpPath = writeTempFile(fileBuffer, ".gif");
      frames = await extractFrames(tmpPath, {
        frameCount: parseInt(process.env.GIF_FRAME_COUNT || "6"),
      });
      const frameAnalysis = await analyzeFrames(frames);
      googleResult = {
        ...makeDecision(frameAnalysis.worstScores),
        sourceType: "gif",
        ...frameAnalysis,
      };

    } else if (fileType === "video") {
      // Derive extension from video MIME type (video/mp4 → .mp4)
      const ext = "." + (mimeType.split("/")[1] || "mp4");
      tmpPath = writeTempFile(fileBuffer, ext);
      frames = await extractFrames(tmpPath, {
        interval: parseInt(process.env.VIDEO_FRAME_INTERVAL_SECONDS || "2"),
        maxFrames: parseInt(process.env.VIDEO_MAX_FRAMES || "30"),
      });
      const frameAnalysis = await analyzeFrames(frames);
      googleResult = {
        ...makeDecision(frameAnalysis.worstScores),
        sourceType: "video",
        ...frameAnalysis,
      };
    }
  } finally {
    if (tmpPath) cleanupTempFile(tmpPath);
  }

  const latencyGoogle = Date.now() - startTime;

  // ── FAST PATH: hard block or clear allow ─────────────────────────
  if (googleResult.decision === "block") {
    return buildResult("block", "google_vision", googleResult, null, latencyGoogle, meta);
  }
  if (googleResult.decision === "allow") {
    return buildResult("allow", "google_vision", googleResult, null, latencyGoogle, meta);
  }

  // ── GRAY ZONE: escalate to Claude ───────────────────────────────
  logger.info("Gray zone — escalating to Claude", { sourceType: googleResult.sourceType });

  const frameForClaude =
    frames.length > 0 ? frames[googleResult.worstFrameIndex || 0] : fileBuffer;

  const claudeStart = Date.now();
  const claudeResult = await claudeSecondaryCheck(
    frameForClaude,
    googleResult.worstScores || googleResult.scores,
    googleResult.sourceType,
    {
      frameIndex:    googleResult.worstFrameIndex || 0,
      totalFrames:   googleResult.totalFrames || 1,
      flaggedFrames: googleResult.flaggedFrameCount || 0,
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

  if (claudeResult.action === "flag") {
    await addToHumanReviewQueue({ ...finalResult, uploadMeta: meta });
  }

  logger.info("Moderation complete", {
    finalDecision: finalResult.finalDecision,
    totalMs: finalResult.performance.totalMs,
  });

  return finalResult;
}

function buildResult(decision, layer, googleResult, claudeResult, latencyGoogle, meta, latencyClaude = 0) {
  return {
    finalDecision:  decision,
    layer,
    sourceType:     googleResult.sourceType,
    googleScores:   googleResult.worstScores || googleResult.scores,
    googleReason:   googleResult.reason,
    claude: claudeResult
      ? {
          action:     claudeResult.action,
          confidence: claudeResult.confidence,
          reason:     claudeResult.reason,
          categories: claudeResult.categories,
        }
      : null,
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

- [ ] **Step 2: Commit**

```bash
git add src/orchestrator.js
git commit -m "feat: add orchestrator module"
```

---

## Task 10: `src/api-key-middleware.js`

**Files:**
- Create: `src/api-key-middleware.js`

This is the "plug and play" layer. Each consumer sends their API key via `Authorization: Bearer <key>` header.

- [ ] **Step 1: Create the file**

```javascript
// src/api-key-middleware.js

// Load valid API keys from env (comma-separated) at startup
const validKeys = new Set(
  (process.env.VALID_API_KEYS || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
);

/**
 * Express middleware that validates API key from Authorization header.
 * Rejects with 401 if key is missing or not in the valid set.
 *
 * Usage: app.use(requireApiKey) before any protected routes.
 */
export function requireApiKey(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const key = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!key || !validKeys.has(key)) {
    return res.status(401).json({ error: "Invalid or missing API key" });
  }

  next();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api-key-middleware.js
git commit -m "feat: add API key middleware"
```

---

## Task 11: `src/index.js` — Express Server

**Files:**
- Create: `src/index.js`

- [ ] **Step 1: Create the file**

```javascript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/index.js
git commit -m "feat: add Express server with /moderate and /health routes"
```

---

## Task 12: Integration Tests

**Files:**
- Create: `tests/test-image.js`
- Create: `tests/test-gif.js`
- Create: `tests/test-video.js`
- Create: `tests/sample-safe.jpg` (you must supply a safe test image)
- Create: `tests/sample-safe.gif` (you must supply a safe test GIF)
- Create: `tests/sample-safe.mp4` (you must supply a safe test video)

- [ ] **Step 1: Create `tests/test-image.js`**

```javascript
// tests/test-image.js
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runModeration } from "../src/orchestrator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const imagePath = path.join(__dirname, "sample-safe.jpg");
  if (!fs.existsSync(imagePath)) {
    throw new Error("Missing tests/sample-safe.jpg — add a safe JPEG to test with");
  }

  const buffer = fs.readFileSync(imagePath);
  const result = await runModeration(buffer, "image/jpeg", { uploadId: "test-001", userId: "tester" });

  console.log("IMAGE TEST RESULT:", JSON.stringify(result, null, 2));
  console.assert(["allow", "flag", "block"].includes(result.finalDecision), "finalDecision must be valid");
  console.assert(result.performance?.totalMs > 0, "totalMs must be positive");
  console.log("✓ image test passed");
}

main().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Create `tests/test-gif.js`**

```javascript
// tests/test-gif.js
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runModeration } from "../src/orchestrator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const gifPath = path.join(__dirname, "sample-safe.gif");
  if (!fs.existsSync(gifPath)) {
    throw new Error("Missing tests/sample-safe.gif — add a safe GIF to test with");
  }

  const buffer = fs.readFileSync(gifPath);
  const result = await runModeration(buffer, "image/gif", { uploadId: "test-002", userId: "tester" });

  console.log("GIF TEST RESULT:", JSON.stringify(result, null, 2));
  console.assert(result.sourceType === "gif", "sourceType must be gif");
  console.assert(result.performance?.totalMs > 0, "totalMs must be positive");
  console.log("✓ gif test passed");
}

main().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 3: Create `tests/test-video.js`**

```javascript
// tests/test-video.js
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runModeration } from "../src/orchestrator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const videoPath = path.join(__dirname, "sample-safe.mp4");
  if (!fs.existsSync(videoPath)) {
    throw new Error("Missing tests/sample-safe.mp4 — add a safe MP4 to test with");
  }

  const buffer = fs.readFileSync(videoPath);
  const result = await runModeration(buffer, "video/mp4", { uploadId: "test-003", userId: "tester" });

  console.log("VIDEO TEST RESULT:", JSON.stringify(result, null, 2));
  console.assert(result.sourceType === "video", "sourceType must be video");
  console.assert(result.performance?.totalMs > 0, "totalMs must be positive");
  console.log("✓ video test passed");
}

main().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 4: Add safe test media files**

Place the following files in `tests/`:
- `sample-safe.jpg` — any safe JPEG (e.g., a landscape photo)
- `sample-safe.gif` — any safe animated GIF
- `sample-safe.mp4` — any safe short MP4 video (5–10 seconds)

You can use a placeholder image for initial testing:
```bash
curl -o tests/sample-safe.jpg https://via.placeholder.com/400x300.jpg
```

- [ ] **Step 5: Run image test**

```bash
node tests/test-image.js
```

Expected: JSON result printed + `✓ image test passed`

- [ ] **Step 6: Run GIF test**

```bash
node tests/test-gif.js
```

Expected: JSON result printed + `✓ gif test passed`

- [ ] **Step 7: Run video test**

```bash
node tests/test-video.js
```

Expected: JSON result printed + `✓ video test passed`

- [ ] **Step 8: Commit**

```bash
git add tests/
git commit -m "feat: add integration tests for image, GIF, and video moderation"
```

---

## Task 13: End-to-End API Test

**Files:** None (uses curl)

- [ ] **Step 1: Start the server**

```bash
VALID_API_KEYS=test-api-key-123 npm run dev
```

- [ ] **Step 2: Test health endpoint**

```bash
curl http://localhost:3000/health
```

Expected:
```json
{"status":"ok","ts":"2026-04-06T..."}
```

- [ ] **Step 3: Test moderation without API key (expect 401)**

```bash
curl -X POST http://localhost:3000/moderate -F "file=@tests/sample-safe.jpg"
```

Expected:
```json
{"error":"Invalid or missing API key"}
```

- [ ] **Step 4: Test moderation with valid API key**

```bash
curl -X POST http://localhost:3000/moderate \
  -H "Authorization: Bearer test-api-key-123" \
  -H "x-user-id: user-001" \
  -F "file=@tests/sample-safe.jpg"
```

Expected: JSON with `finalDecision: "allow"` and `performance.totalMs > 0`

- [ ] **Step 5: Commit final state**

```bash
git add .
git commit -m "feat: complete moderation API — image/GIF/video pipeline with API key auth"
```

---

## Requirements Checklist

Before starting implementation, confirm you have:

- [ ] **Google Cloud service account JSON** — download from GCP console → IAM → Service Accounts → create key
  - The account needs roles: `Cloud Vision API User`, `Vertex AI User`
- [ ] **GCP Project ID** — for `GOOGLE_CLOUD_PROJECT` env var
- [ ] **Vertex AI Project ID** — usually same as GCP project, for `VERTEX_AI_PROJECT`
- [ ] **Vertex AI Region** — Claude Sonnet on Vertex is available in `us-east5`
- [ ] **Redis running** — BullMQ requires Redis (`brew install redis`)
- [ ] **ffmpeg installed** — for frame extraction (`brew install ffmpeg`)
- [ ] **API keys list** — comma-separated keys for `VALID_API_KEYS`
- [ ] **Test media files** — safe JPEG, GIF, and MP4 for integration tests
