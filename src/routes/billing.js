import express from "express";
import sql from "../db.js";

const router = express.Router();

const PLANS = {
  scale: { plan: "pro", amountCents: 2900 },
  platform: { plan: "platform", amountCents: 19900 },
};

function cleanCardNumber(value = "") {
  return value.replace(/\D/g, "");
}

function luhnValid(value) {
  let sum = 0;
  let alternate = false;
  for (let i = value.length - 1; i >= 0; i -= 1) {
    let n = Number(value[i]);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return value.length >= 12 && sum % 10 === 0;
}

function detectBrand(cardNumber) {
  if (cardNumber.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(cardNumber)) return "mastercard";
  if (/^3[47]/.test(cardNumber)) return "amex";
  return "card";
}

router.post("/checkout", async (req, res) => {
  const { plan = "scale", billingEmail, cardNumber, cardName, expiry, cvc } = req.body || {};
  const selected = PLANS[plan];

  if (!selected) {
    return res.status(400).json({ error: "Unsupported plan" });
  }

  const cleanNumber = cleanCardNumber(cardNumber);
  if (!billingEmail?.includes("@")) {
    return res.status(400).json({ error: "Billing email is required" });
  }
  if (!cardName?.trim()) {
    return res.status(400).json({ error: "Cardholder name is required" });
  }
  if (!luhnValid(cleanNumber)) {
    return res.status(400).json({ error: "Use a valid test card number" });
  }
  if (!/^\d{2}\/\d{2}$/.test(expiry || "")) {
    return res.status(400).json({ error: "Expiry must use MM/YY" });
  }
  if (!/^\d{3,4}$/.test(cvc || "")) {
    return res.status(400).json({ error: "CVC must be 3 or 4 digits" });
  }

  const brand = detectBrand(cleanNumber);
  const last4 = cleanNumber.slice(-4);

  const [event] = await sql`
    INSERT INTO billing_events (user_id, plan, amount_cents, status, card_brand, card_last4, billing_email)
    VALUES (${req.user.userId}, ${selected.plan}, ${selected.amountCents}, 'paid', ${brand}, ${last4}, ${billingEmail})
    RETURNING id, plan, amount_cents, currency, status, card_brand, card_last4, created_at
  `;

  const [user] = await sql`
    UPDATE users
    SET plan = ${selected.plan}
    WHERE id = ${req.user.userId}
    RETURNING id, email, name, avatar_url, plan, is_admin, created_at
  `;

  res.status(201).json({
    ok: true,
    checkout: event,
    user,
  });
});

router.get("/history", async (req, res) => {
  const events = await sql`
    SELECT id, plan, amount_cents, currency, status, card_brand, card_last4, created_at
    FROM billing_events
    WHERE user_id = ${req.user.userId}
    ORDER BY created_at DESC
    LIMIT 20
  `;
  res.json(events);
});

export { router as billingRouter };
