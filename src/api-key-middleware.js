// src/api-key-middleware.js
import sql from "./db.js";

/**
 * Validates the API key from Authorization: Bearer <key> header.
 * Looks up key in the database (not .env).
 * On success: attaches req.apiKey = { id, userId, plan } and continues.
 * On failure: returns 401.
 */
export async function requireApiKey(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const key = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!key) {
    return res.status(401).json({ error: "Missing API key. Use Authorization: Bearer <key>" });
  }

  const [row] = await sql`
    SELECT ak.id, ak.user_id, ak.expires_at, u.plan
    FROM api_keys ak
    JOIN users u ON u.id = ak.user_id
    WHERE ak.key = ${key} AND ak.is_active = true
  `;

  if (!row) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return res.status(401).json({ error: "API key has expired" });
  }

  // Update last_used_at (fire-and-forget)
  sql`UPDATE api_keys SET last_used_at = now() WHERE id = ${row.id}`.catch(() => {});

  req.apiKey = { id: row.id, userId: row.user_id, plan: row.plan };
  next();
}
