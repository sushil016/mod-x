// src/services/usage-logger.js
import sql from "../db.js";
import { logger } from "../utils.js";

/**
 * Log a completed moderation call to the usage_logs table.
 * Fire-and-forget — call without await so it never blocks the response.
 *
 * @param {Object} params
 * @param {string} params.apiKeyId
 * @param {string} params.userId
 * @param {Object} params.result    - the moderation result from orchestrator
 * @param {number} params.fileSize  - bytes
 */
export function logUsage({ apiKeyId, userId, result, fileSize }) {
  sql`
    INSERT INTO usage_logs
      (api_key_id, user_id, source_type, final_decision, layer, google_ms, claude_ms, total_ms, file_size)
    VALUES
      (${apiKeyId}, ${userId}, ${result.sourceType}, ${result.finalDecision},
       ${result.layer}, ${result.performance.googleMs}, ${result.performance.claudeMs},
       ${result.performance.totalMs}, ${fileSize})
  `.catch((err) => logger.error("Failed to log usage", { error: err.message }));
}
