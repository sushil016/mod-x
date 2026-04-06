// tests/test-image.js
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runModeration } from "../src/orchestrator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const imagePath = path.join(__dirname, "sample-safe.jpg");
  if (!fs.existsSync(imagePath)) {
    console.error("Missing tests/sample-safe.jpg — add a safe JPEG to test with");
    process.exit(1);
  }

  const buffer = fs.readFileSync(imagePath);
  const result = await runModeration(buffer, "image/jpeg", { uploadId: "test-001", userId: "tester" });

  console.log("IMAGE TEST RESULT:", JSON.stringify(result, null, 2));
  console.assert(["allow", "flag", "block"].includes(result.finalDecision), "finalDecision must be valid");
  console.assert(result.performance?.totalMs > 0, "totalMs must be positive");
  console.log("✓ image test passed");
}

main().catch((err) => { console.error(err); process.exit(1); });
