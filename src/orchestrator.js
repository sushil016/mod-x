// src/orchestrator.js
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
