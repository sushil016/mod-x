// src/key-generator.js
import crypto from "crypto";

/**
 * Generate a cryptographically random API key.
 * Format: mod_sk_<32 random hex chars>
 * Example: mod_sk_a3f8c2d19e4b7a6f0c5d8e2b4a1f9c3d
 *
 * @returns {string}
 */
export function generateApiKey() {
  return "mod_sk_" + crypto.randomBytes(24).toString("hex");
}
