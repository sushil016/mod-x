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
