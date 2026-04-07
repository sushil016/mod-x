#!/usr/bin/env node
// scripts/generate-key.js
// Usage:
//   node scripts/generate-key.js           → generate 1 key
//   node scripts/generate-key.js 5         → generate 5 keys
//   node scripts/generate-key.js --save    → generate 1 key and append to .env

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_FILE = path.join(__dirname, "../.env");

function generateApiKey() {
  return "mod_sk_" + crypto.randomBytes(24).toString("hex");
}

function appendToEnv(key) {
  if (!fs.existsSync(ENV_FILE)) {
    console.error("⚠️  .env file not found. Create it first from .env.example");
    process.exit(1);
  }

  let content = fs.readFileSync(ENV_FILE, "utf-8");

  if (content.includes("VALID_API_KEYS=")) {
    // Append key to existing VALID_API_KEYS line
    content = content.replace(
      /^VALID_API_KEYS=(.*)$/m,
      (_, existing) => {
        const trimmed = existing.trim();
        return trimmed
          ? `VALID_API_KEYS=${trimmed},${key}`
          : `VALID_API_KEYS=${key}`;
      }
    );
  } else {
    // Add the line at the end
    content += `\nVALID_API_KEYS=${key}\n`;
  }

  fs.writeFileSync(ENV_FILE, content);
  console.log(`✅  Key appended to .env → VALID_API_KEYS`);
}

// --- CLI ---
const args = process.argv.slice(2);
const save = args.includes("--save");
const countArg = args.find((a) => /^\d+$/.test(a));
const count = countArg ? parseInt(countArg) : 1;

console.log(`\n🔑  Generated API Key${count > 1 ? "s" : ""}:\n`);

const keys = [];
for (let i = 0; i < count; i++) {
  const key = generateApiKey();
  keys.push(key);
  console.log(`  ${key}`);
}

console.log("");

if (save) {
  if (count > 1) {
    console.error("⚠️  --save only works with a single key. Run without a count or use count=1.");
    process.exit(1);
  }
  appendToEnv(keys[0]);
}

if (!save) {
  console.log("💡  To save to .env automatically, run:");
  console.log("    node scripts/generate-key.js --save\n");
}
