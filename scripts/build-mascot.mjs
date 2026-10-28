// Optimizes the mascot art in assets/mascot/ (outside public/) into public/mascot/.
// Run with `npm run mascot` after replacing any source PNG.
import { mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const POSES = [
  "today",
  "checkin",
  "calendar",
  "train",
  "insights",
  "me",
  "menstrual",
  "follicular",
  "ovulatory",
  "luteal",
  "water",
  "validation",
];
const WIDTHS = [160, 320, 640];
const PNG_FALLBACK_WIDTH = 640;
const PADDING = 0.04;
const WARN_320_BYTES = 60 * 1024;
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const root = process.cwd();
const sourceDir = join(root, "assets/mascot");
const outDir = join(root, "public/mascot");
mkdirSync(outDir, { recursive: true });

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
let warnings = 0;

for (const pose of POSES) {
  // Trim the transparent edges (sharp uses the alpha channel for this).
  const trimmed = await sharp(join(sourceDir, `mascot-${pose}.png`)).trim().toBuffer({ resolveWithObject: true });
  const { width, height } = trimmed.info;
  // 4% transparent padding on every side, then centered on a square canvas so every pose
  // fills the same square box the same way.
  const pad = Math.round(Math.max(width, height) * PADDING);
  const side = Math.max(width, height) + 2 * pad;
  const left = Math.floor((side - width) / 2);
  const top = Math.floor((side - height) / 2);
  const square = await sharp(trimmed.data)
    .extend({ top, bottom: side - height - top, left, right: side - width - left, background: TRANSPARENT })
    .png()
    .toBuffer();

  for (const outWidth of WIDTHS) {
    const file = join(outDir, `mascot-${pose}-${outWidth}.webp`);
    await sharp(square).resize({ width: outWidth }).webp({ quality: 85, alphaQuality: 100 }).toFile(file);
    const bytes = statSync(file).size;
    const tooBig = outWidth === 320 && bytes > WARN_320_BYTES;
    if (tooBig) warnings += 1;
    console.log(`public/mascot/mascot-${pose}-${outWidth}.webp`.padEnd(42), kb(bytes).padStart(10), tooBig ? "  WARNING: over 60 KB" : "");
  }

  const pngFile = join(outDir, `mascot-${pose}-${PNG_FALLBACK_WIDTH}.png`);
  await sharp(square).resize({ width: PNG_FALLBACK_WIDTH }).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(pngFile);
  console.log(`public/mascot/mascot-${pose}-${PNG_FALLBACK_WIDTH}.png`.padEnd(42), kb(statSync(pngFile).size).padStart(10));
}

if (warnings > 0) console.warn(`\n${warnings} of the 320px WebP files are over 60 KB.`);
