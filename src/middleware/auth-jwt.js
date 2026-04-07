// src/middleware/auth-jwt.js
import jwt from "jsonwebtoken";

/**
 * Verifies the JWT access_token cookie.
 * On success, attaches req.user = { userId, email, isAdmin }.
 * On failure, returns 401.
 */
export function requireJwt(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId:  payload.userId,
      email:   payload.email,
      isAdmin: payload.isAdmin,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Session expired" });
  }
}

/**
 * After requireJwt: rejects if user is not an admin.
 */
export function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
