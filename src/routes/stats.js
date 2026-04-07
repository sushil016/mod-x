// src/routes/stats.js
import express from "express";
import sql from "../db.js";

const router = express.Router();

// GET /api/stats — usage stats for last 30 days
router.get("/", async (req, res) => {
  const userId = req.user.userId;

  // Requests per day for the last 30 days
  const daily = await sql`
    SELECT
      DATE(created_at) AS date,
      COUNT(*)::int    AS count
    FROM usage_logs
    WHERE user_id = ${userId}
      AND created_at >= now() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date
  `;

  // Decision breakdown (all time)
  const decisions = await sql`
    SELECT final_decision, COUNT(*)::int AS count
    FROM usage_logs
    WHERE user_id = ${userId}
    GROUP BY final_decision
  `;

  // Summary stats
  const [summary] = await sql`
    SELECT
      COUNT(*)::int                       AS total_requests,
      ROUND(AVG(total_ms))::int           AS avg_latency_ms,
      COUNT(*) FILTER (WHERE final_decision = 'block')::int AS total_blocked,
      COUNT(*) FILTER (WHERE final_decision = 'flag')::int  AS total_flagged,
      COUNT(*) FILTER (WHERE final_decision = 'allow')::int AS total_allowed
    FROM usage_logs
    WHERE user_id = ${userId}
  `;

  // Most active key
  const [topKey] = await sql`
    SELECT ak.name, COUNT(ul.id)::int AS call_count
    FROM usage_logs ul
    JOIN api_keys ak ON ak.id = ul.api_key_id
    WHERE ul.user_id = ${userId}
    GROUP BY ak.name
    ORDER BY call_count DESC
    LIMIT 1
  `;

  res.json({
    daily,
    decisions,
    summary,
    topKey: topKey || null,
  });
});

export { router as statsRouter };
