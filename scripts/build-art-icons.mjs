// Optimizes the 3D icon art in assets/icons/ (outside public/) into public/art-icons/.
// Run with `npm run art-icons` after adding or replacing a source file.
import { mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

// Source file name in assets/icons/ and the output name used by ArtIcon.
const ICONS = [
  { source: "PERIOD-ICON.webp", name: "period" },
  { source: "SLEEP-ICON.webp", name: "sleep" },
  { source: "FOOD-ICON.png", name: "food" },
  { source: "TRAIN-ICON.png", name: "train" },
  { source: "SOCIAL-ICON.png", name: "social" },
  { source: "energy-icon.png", name: "energy" },
  { source: "security3dicon.png", name: "security" },
  { source: "heart3dicon.png", name: "heart" },
  { source: "periodbloodicon.png", name: "blood" },
];
// Icons show at 24 to 36px, so 144px covers a 4x screen.
const OUT_WIDTH = 144;
const PADDING = 0.04;
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const root = process.cwd();
const sourceDir = join(root, "assets/icons");
const outDir = join(root, "public/art-icons");
mkdirSync(outDir, { recursive: true });

for (const { source, name } of ICONS) {
  // Trim the transparent edges, pad 4% and center on a square, like the mascot.
  const trimmed = await sharp(join(sourceDir, source)).trim().toBuffer({ resolveWithObject: true });
  const { width, height } = trimmed.info;
  const pad = Math.round(Math.max(width, height) * PADDING);
  const side = Math.max(width, height) + 2 * pad;
  const left = Math.floor((side - width) / 2);
  const top = Math.floor((side - height) / 2);
  const file = join(outDir, `${name}-${OUT_WIDTH}.webp`);
  await sharp(trimmed.data)
    .extend({ top, bottom: side - height - top, left, right: side - width - left, background: TRANSPARENT })
    .resize({ width: OUT_WIDTH })
    .webp({ quality: 85, alphaQuality: 100 })
    .toFile(file);
  console.log(`public/art-icons/${name}-${OUT_WIDTH}.webp`.padEnd(38), `${(statSync(file).size / 1024).toFixed(1)} KB`);
}
