// src/google-vision.js
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { prepareGoogleCredentials } from "./google-credentials.js";
import { logger } from "./utils.js";

prepareGoogleCredentials();
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
