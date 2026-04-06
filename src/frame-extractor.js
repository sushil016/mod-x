// src/frame-extractor.js
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";
import { silentUnlink } from "./utils.js";

/**
 * Extract frames from a GIF or video file path using ffmpeg.
 *
 * @param {string} inputPath   - path to the temp file on disk
 * @param {Object} options
 * @param {number} [options.frameCount]  - fixed number of evenly-spaced frames (GIF mode)
 * @param {number} [options.interval]    - seconds between frames (video mode)
 * @param {number} [options.maxFrames]   - hard cap on extracted frames
 * @returns {Promise<Buffer[]>}          - array of JPEG frame buffers
 */
export async function extractFrames(inputPath, options = {}) {
  const {
    frameCount,
    interval = 2,
    maxFrames = parseInt(process.env.VIDEO_MAX_FRAMES || "30"),
  } = options;

  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "mod-frames-"));

  return new Promise((resolve, reject) => {
    const cmd = ffmpeg(inputPath);

    if (frameCount) {
      // GIF: select every Nth frame to get ~frameCount frames
      cmd.outputOptions([
        `-vf select='not(mod(n\\,2))'`,
        `-frames:v ${frameCount}`,
      ]);
    } else {
      // Video: 1 frame every `interval` seconds, capped at maxFrames
      cmd.outputOptions([`-vf fps=1/${interval}`, `-frames:v ${maxFrames}`]);
    }

    cmd
      .output(path.join(outputDir, "frame-%03d.jpg"))
      .on("end", () => {
        const files = fs
          .readdirSync(outputDir)
          .filter((f) => f.endsWith(".jpg"))
          .sort();

        const buffers = files.map((f) =>
          fs.readFileSync(path.join(outputDir, f))
        );

        // Cleanup temp frames dir
        files.forEach((f) => silentUnlink(path.join(outputDir, f)));
        try { fs.rmdirSync(outputDir); } catch (_) {}

        resolve(buffers);
      })
      .on("error", (err) => {
        reject(new Error(`ffmpeg error: ${err.message}`));
      })
      .run();
  });
}

/**
 * Write a buffer to a temp file so ffmpeg can read it.
 * Caller MUST call cleanupTempFile() after use.
 *
 * @param {Buffer} buffer
 * @param {string} ext    - e.g. ".gif", ".mp4"
 * @returns {string}      - absolute path to temp file
 */
export function writeTempFile(buffer, ext = ".mp4") {
  const tmpPath = path.join(os.tmpdir(), `mod-upload-${Date.now()}${ext}`);
  fs.writeFileSync(tmpPath, buffer);
  return tmpPath;
}

/**
 * Delete a temp file silently.
 * @param {string} filePath
 */
export function cleanupTempFile(filePath) {
  silentUnlink(filePath);
}
