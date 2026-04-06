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
