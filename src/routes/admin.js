// src/routes/admin.js
import express from "express";
import sql from "../db.js";

const router = express.Router();

// GET /api/admin/stats — platform-wide stats
router.get("/stats", async (_req, res) => {
  const [stats] = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM users)                              AS total_users,
      (SELECT COUNT(*)::int FROM api_keys WHERE is_active = true)   AS total_active_keys,
      (SELECT COUNT(*)::int FROM usage_logs)                         AS total_requests,
      (SELECT COUNT(*)::int FROM usage_logs WHERE final_decision = 'block') AS total_blocked,
      (SELECT COUNT(*)::int FROM usage_logs WHERE final_decision = 'flag')  AS total_flagged,
      (SELECT COUNT(*)::int FROM usage_logs WHERE final_decision = 'allow') AS total_allowed
  `;
  res.json(stats);
});

// GET /api/admin/users — all users
router.get("/users", async (_req, res) => {
  const users = await sql`
    SELECT
      u.id, u.email, u.name, u.avatar_url, u.plan, u.is_admin, u.created_at,
      COUNT(DISTINCT ak.id)::int  AS key_count,
      COUNT(DISTINCT ul.id)::int  AS total_calls
    FROM users u
    LEFT JOIN api_keys   ak ON ak.user_id = u.id
    LEFT JOIN usage_logs ul ON ul.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;
  res.json(users);
});

// PATCH /api/admin/users/:id — change plan or toggle admin
router.patch("/users/:id", async (req, res) => {
  const { plan, isAdmin } = req.body;
  const updates = {};
  if (plan !== undefined)    updates.plan = plan;
  if (isAdmin !== undefined) updates.is_admin = isAdmin;
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No fields to update" });

  const [user] = await sql`
    UPDATE users SET ${sql(updates)}
    WHERE id = ${req.params.id}
    RETURNING id, email, plan, is_admin
  `.catch(() => [null]);

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// GET /api/admin/keys — all API keys
router.get("/keys", async (_req, res) => {
  const keys = await sql`
    SELECT
      ak.id, ak.name, ak.key, ak.is_active, ak.created_at, ak.last_used_at, ak.expires_at,
      u.email AS owner_email,
      COUNT(ul.id)::int AS call_count
    FROM api_keys ak
    JOIN users u ON u.id = ak.user_id
    LEFT JOIN usage_logs ul ON ul.api_key_id = ak.id
    GROUP BY ak.id, u.email
    ORDER BY ak.created_at DESC
  `;
  res.json(keys);
});

// DELETE /api/admin/keys/:id — force-revoke any key
router.delete("/keys/:id", async (req, res) => {
  const [revoked] = await sql`
    UPDATE api_keys SET is_active = false
    WHERE id = ${req.params.id}
    RETURNING id
  `;
  if (!revoked) return res.status(404).json({ error: "Key not found" });
  res.json({ ok: true });
});

export { router as adminRouter };
