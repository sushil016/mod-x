// src/claude-vertex.js
import { AnthropicVertex } from "@anthropic-ai/vertex-sdk";
import { logger } from "./utils.js";

const client = new AnthropicVertex({
  region:    process.env.VERTEX_AI_REGION    || "us-east5",
  projectId: process.env.VERTEX_AI_PROJECT   || "dazzling-spirit-426406-m4",
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
