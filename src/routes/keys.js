// src/routes/keys.js
import express from "express";
import sql from "../db.js";
import { generateApiKey } from "../key-generator.js";

const router = express.Router();

// GET /api/keys — list all keys for the logged-in developer
router.get("/", async (req, res) => {
  const keys = await sql`
    SELECT id, name, key, is_active, expires_at, last_used_at, created_at
    FROM api_keys
    WHERE user_id = ${req.user.userId}
    ORDER BY created_at DESC
  `;
  res.json(keys);
});

// POST /api/keys — create a new key
router.post("/", async (req, res) => {
  const { name, expiresAt } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: "Key name is required" });
  }

  const key = generateApiKey();

  const [created] = await sql`
    INSERT INTO api_keys (user_id, name, key, expires_at)
    VALUES (${req.user.userId}, ${name.trim()}, ${key}, ${expiresAt || null})
    RETURNING id, name, key, is_active, expires_at, last_used_at, created_at
  `;
  res.status(201).json(created);
});

// PATCH /api/keys/:id — rename a key
router.patch("/:id", async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: "Key name is required" });
  }

  const [updated] = await sql`
    UPDATE api_keys
    SET name = ${name.trim()}
    WHERE id = ${req.params.id} AND user_id = ${req.user.userId}
    RETURNING id, name, key, is_active, expires_at, last_used_at, created_at
  `;

  if (!updated) return res.status(404).json({ error: "Key not found" });
  res.json(updated);
});

// DELETE /api/keys/:id — revoke a key (soft delete)
router.delete("/:id", async (req, res) => {
  const [revoked] = await sql`
    UPDATE api_keys
    SET is_active = false
    WHERE id = ${req.params.id} AND user_id = ${req.user.userId}
    RETURNING id
  `;

  if (!revoked) return res.status(404).json({ error: "Key not found" });
  res.json({ ok: true });
});

export { router as keysRouter };
