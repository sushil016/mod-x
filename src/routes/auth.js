// src/routes/auth.js
import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sql from "../db.js";

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

const ACCESS_TOKEN_TTL  = 15 * 60;          // 15 minutes in seconds
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

// ── Passport setup ──────────────────────────────────────────────────────────

passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email     = profile.emails?.[0]?.value;
      const name      = profile.displayName;
      const avatarUrl = profile.photos?.[0]?.value;

      // Upsert user — update name/avatar on each login
      const [user] = await sql`
        INSERT INTO users (google_id, email, name, avatar_url)
        VALUES (${profile.id}, ${email}, ${name}, ${avatarUrl})
        ON CONFLICT (google_id) DO UPDATE
          SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
        RETURNING id, email, name, avatar_url, plan, is_admin
      `;
      done(null, user);
    } catch (err) {
      done(err);
    }
  }
));

// Passport requires serialize/deserialize even if we don't use sessions
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ── Helpers ─────────────────────────────────────────────────────────────────

function issueTokens(res, user) {
  // Access token — short lived JWT
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, isAdmin: user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );

  // Refresh token — random opaque string, store hash in DB
  const rawRefresh  = crypto.randomBytes(40).toString("hex");
  const tokenHash   = crypto.createHash("sha256").update(rawRefresh).digest("hex");
  const expiresAt   = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000);

  // Store hash (fire-and-forget — don't await to keep response fast)
  sql`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${tokenHash}, ${expiresAt})
  `.catch(console.error);

  res.cookie("access_token",  accessToken, { ...COOKIE_OPTS, maxAge: ACCESS_TOKEN_TTL * 1000 });
  res.cookie("refresh_token", rawRefresh,  { ...COOKIE_OPTS, maxAge: REFRESH_TOKEN_TTL * 1000 });
}

// ── Routes ───────────────────────────────────────────────────────────────────

router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login?error=oauth" }),
  (req, res) => {
    issueTokens(res, req.user);
    res.redirect("/dashboard");
  }
);

router.post("/refresh", async (req, res) => {
  const rawRefresh = req.cookies?.refresh_token;
  if (!rawRefresh) return res.status(401).json({ error: "No refresh token" });

  const tokenHash = crypto.createHash("sha256").update(rawRefresh).digest("hex");

  const [stored] = await sql`
    SELECT rt.user_id, rt.expires_at, u.email, u.is_admin
    FROM refresh_tokens rt
    JOIN users u ON u.id = rt.user_id
    WHERE rt.token_hash = ${tokenHash}
  `;

  if (!stored || new Date(stored.expires_at) < new Date()) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }

  const accessToken = jwt.sign(
    { userId: stored.user_id, email: stored.email, isAdmin: stored.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );

  res.cookie("access_token", accessToken, { ...COOKIE_OPTS, maxAge: ACCESS_TOKEN_TTL * 1000 });
  res.json({ ok: true });
});

router.post("/logout", async (req, res) => {
  const rawRefresh = req.cookies?.refresh_token;
  if (rawRefresh) {
    const tokenHash = crypto.createHash("sha256").update(rawRefresh).digest("hex");
    await sql`DELETE FROM refresh_tokens WHERE token_hash = ${tokenHash}`;
  }
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.json({ ok: true });
});

export { router as authRouter, passport };
