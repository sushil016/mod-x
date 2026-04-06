// tests/test-video.js
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runModeration } from "../src/orchestrator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const videoPath = path.join(__dirname, "sample-safe.mp4");
  if (!fs.existsSync(videoPath)) {
    console.error("Missing tests/sample-safe.mp4 — add a safe MP4 video to test with");
    process.exit(1);
  }

  const buffer = fs.readFileSync(videoPath);
  const result = await runModeration(buffer, "video/mp4", { uploadId: "test-003", userId: "tester" });

  console.log("VIDEO TEST RESULT:", JSON.stringify(result, null, 2));
  console.assert(result.sourceType === "video", "sourceType must be video");
  console.assert(result.performance?.totalMs > 0, "totalMs must be positive");
  console.log("✓ video test passed");
}

main().catch((err) => { console.error(err); process.exit(1); });
