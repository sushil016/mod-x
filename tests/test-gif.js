// tests/test-gif.js
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runModeration } from "../src/orchestrator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const gifPath = path.join(__dirname, "sample-safe.gif");
  if (!fs.existsSync(gifPath)) {
    console.error("Missing tests/sample-safe.gif — add a safe animated GIF to test with");
    process.exit(1);
  }

  const buffer = fs.readFileSync(gifPath);
  const result = await runModeration(buffer, "image/gif", { uploadId: "test-002", userId: "tester" });

  console.log("GIF TEST RESULT:", JSON.stringify(result, null, 2));
  console.assert(result.sourceType === "gif", "sourceType must be gif");
  console.assert(result.performance?.totalMs > 0, "totalMs must be positive");
  console.log("✓ gif test passed");
}

main().catch((err) => { console.error(err); process.exit(1); });
