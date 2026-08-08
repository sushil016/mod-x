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
 * Map MIME type to the media_type string expected by Vision APIs.
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
