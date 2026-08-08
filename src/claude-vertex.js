// src/claude-vertex.js
import { logger } from "./utils.js";

const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "deepseek-ai/deepseek-v4-pro";
const NVIDIA_MAX_TOKENS = parseInt(process.env.NVIDIA_MAX_TOKENS || "16384", 10);

/**
 * Secondary moderation via NVIDIA's OpenAI-compatible chat API.
 * Called ONLY for gray-zone content (~15% of uploads).
 *
 * @param {Buffer}  imageBuffer   - kept for API compatibility; NVIDIA chat model reasons from scores/meta.
 * @param {Object}  googleScores  - { adult, violence, racy } from Google Vision
 * @param {string}  sourceType    - "image" | "gif" | "video"
 * @param {Object}  [meta]        - { frameIndex, totalFrames, flaggedFrames }
 * @returns {Promise<{ action: string, confidence: number, reason: string, safe: boolean, categories: Object }>}
 */
export async function claudeSecondaryCheck(imageBuffer, googleScores, sourceType, meta = {}) {
  void imageBuffer;

  const contextNote =
    sourceType !== "image"
      ? `This is frame ${(meta.frameIndex || 0) + 1} of ${meta.totalFrames || 1} from a ${sourceType}. ` +
        `${meta.flaggedFrames || 0} frame(s) were flagged by Google Vision.`
      : "This is a single image.";

  const systemPrompt = `You are a strict content moderation reasoning layer for apps that accept user uploads.
Google Cloud Vision flagged this content as uncertain with these scores:
- Adult: ${googleScores.adult}
- Violence: ${googleScores.violence}
- Racy: ${googleScores.racy}
- Medical: ${googleScores.medical ?? 0}
- Spoof: ${googleScores.spoof ?? 0}

${contextNote}

You do not receive the raw image. Reason only from the Google Vision scores and upload metadata.
Use cost-safe escalation logic:
- allow when scores look benign or explainable
- block when scores strongly indicate unsafe content
- flag when the evidence is uncertain and needs review
Be strict for user-generated uploads, but do not over-block borderline educational, medical, or harmless content.

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

  if (!process.env.NVIDIA_API_KEY) {
    logger.error("NVIDIA API key missing");
    return {
      safe: false,
      confidence: 0,
      action: "flag",
      reason: "NVIDIA_API_KEY is missing — flagged for human review",
      categories: {},
    };
  }

  let payload;
  try {
    const response = await fetch(`${NVIDIA_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        temperature: 0.2,
        top_p: 0.95,
        max_tokens: NVIDIA_MAX_TOKENS,
        stream: false,
        chat_template_kwargs: { thinking: false },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Make the final moderation decision for this ${sourceType}. Return JSON only.`,
          },
        ],
      }),
    });

    payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.error?.message || `NVIDIA API returned ${response.status}`);
    }
  } catch (err) {
    logger.error("NVIDIA LLM API error", { error: err.message });
    return {
      safe: false,
      confidence: 0,
      action: "flag",
      reason: `NVIDIA LLM API error — flagged for human review: ${err.message}`,
      categories: {},
    };
  }

  const rawText = payload?.choices?.[0]?.message?.content || "";

  try {
    const clean = rawText.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    logger.error("NVIDIA LLM response parse error", { rawText });
    return {
      safe: false,
      confidence: 0,
      action: "flag",
      reason: "NVIDIA LLM response malformed — flagged for human review",
      categories: {},
    };
  }
}
