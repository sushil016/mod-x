// src/decision-engine.js

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
      reason: "Google Vision: gray zone — escalating to NVIDIA LLM",
    };
  }

  return {
    decision: "allow",
    scores,
    reason: "Google Vision: all scores within safe range",
  };
}
