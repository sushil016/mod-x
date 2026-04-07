// src/middleware/rate-limiter.js
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
});

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
  const multi = redis.multi();
  multi.zremrangebyscore(redisKey, "-inf", windowStart);        // remove old entries
  multi.zadd(redisKey, now, `${now}-${Math.random()}`);         // add current request
  multi.zcard(redisKey);                                         // count in window
  multi.expire(redisKey, WINDOW_SECONDS);                        // auto-expire key

  const results = await multi.exec();
  const count = results[2][1]; // zcard result

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
