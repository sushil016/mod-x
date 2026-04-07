// src/middleware/rate-limiter.js
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  enableOfflineQueue: false,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 500, 5000),
});

// Suppress unhandled connection errors — rate limiter degrades gracefully
redis.on("error", () => {});

const WINDOW_SECONDS = 60 * 60; // 1 hour

const PLAN_LIMITS = {
  free: 100,
  pro:  1000,
};

/**
 * Redis sliding window rate limiter.
 * Requires req.apiKey = { id, userId, plan } (set by api-key-middleware).
 * Sets X-RateLimit-* headers and returns 429 if limit exceeded.
 */
export async function rateLimiter(req, res, next) {
  const { id: keyId, plan } = req.apiKey;
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const redisKey = `rl:${keyId}`;
  const now = Date.now();
  const windowStart = now - WINDOW_SECONDS * 1000;

  // Sliding window using Redis sorted set
  // Score = timestamp ms, member = unique request id
  let count;
  try {
    const multi = redis.multi();
    multi.zremrangebyscore(redisKey, "-inf", windowStart);
    multi.zadd(redisKey, now, `${now}-${Math.random()}`);
    multi.zcard(redisKey);
    multi.expire(redisKey, WINDOW_SECONDS);
    const results = await multi.exec();
    count = results[2][1];
  } catch {
    // Redis unavailable — skip rate limiting and pass through
    return next();
  }

  const resetAt = Math.ceil((now + WINDOW_SECONDS * 1000) / 1000);

  res.setHeader("X-RateLimit-Limit",     limit);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - count));
  res.setHeader("X-RateLimit-Reset",     resetAt);

  if (count > limit) {
    res.setHeader("Retry-After", WINDOW_SECONDS);
    return res.status(429).json({
      error: "Rate limit exceeded",
      retryAfter: WINDOW_SECONDS,
      limit,
      plan,
    });
  }

  next();
}
