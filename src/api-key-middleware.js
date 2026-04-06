// src/api-key-middleware.js

// Load valid API keys from env (comma-separated) at startup
const validKeys = new Set(
  (process.env.VALID_API_KEYS || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
);

/**
 * Express middleware that validates API key from Authorization header.
 * Rejects with 401 if key is missing or not in the valid set.
 *
 * Usage: app.use(requireApiKey) before any protected routes.
 *
 * Expected header: Authorization: Bearer <api-key>
 */
export function requireApiKey(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const key = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!key || !validKeys.has(key)) {
    return res.status(401).json({ error: "Invalid or missing API key" });
  }

  next();
}
