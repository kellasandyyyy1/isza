// Builds the app icons from the logo in assets/icons/app-logo.png (outside public/).
// Run with `npm run icons` after replacing the logo.
// - public/icons/icon-192.png, icon-512.png: the installed app icon, the whole square logo.
// - public/icons/icon-maskable-512.png: the same; the ring already sits inside the central safe zone.
// - src/app/apple-icon.png: the iOS home screen icon (Next adds the link tag from the file name).
// - src/app/favicon.ico: the browser tab icon, cropped close to the ring so it reads at 16px.
// - src/app/opengraph-image.png: a placeholder link preview, the logo on the app background.
// - public/icons/badge-72.png: the monochrome notification badge. Android uses only its alpha channel, so it stays
//   a white "i" on transparent rather than the logo.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const root = process.cwd();
const logo = join(root, "assets/icons/app-logo.png");
const outDir = join(root, "public/icons");
mkdirSync(outDir, { recursive: true });

// The whole square logo, resized.
for (const { file, size } of [
  { file: "public/icons/icon-192.png", size: 192 },
  { file: "public/icons/icon-512.png", size: 512 },
  { file: "public/icons/icon-maskable-512.png", size: 512 },
  { file: "src/app/apple-icon.png", size: 180 },
]) {
  await sharp(logo).resize(size, size).png({ compressionLevel: 9 }).toFile(join(root, file));
  console.log(`Wrote ${file}`);
}

// The favicon: the ring's bounding box plus 10% on each side, kept square and on the logo's own background.
const { info: ring } = await sharp(logo).trim({ threshold: 40 }).toBuffer({ resolveWithObject: true });
const { width: full } = await sharp(logo).metadata();
const ringSide = Math.max(ring.width, ring.height);
const side = Math.min(full, Math.round(ringSide * 1.2));
const centerX = -ring.trimOffsetLeft + ring.width / 2;
const centerY = -ring.trimOffsetTop + ring.height / 2;
const left = Math.max(0, Math.min(full - side, Math.round(centerX - side / 2)));
const top = Math.max(0, Math.min(full - side, Math.round(centerY - side / 2)));
const cropped = await sharp(logo).extract({ left, top, width: side, height: side }).toBuffer();

// An .ico holding PNG images (supported by every current browser): a 6-byte header, one 16-byte entry per image,
// then the PNG data.
const images = [];
// RGBA: Next's .ico decoder rejects PNGs without an alpha channel.
for (const size of [16, 32, 48]) {
  images.push({ size, data: await sharp(cropped).resize(size, size).ensureAlpha().png().toBuffer() });
}
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach(({ size, data }, index) => {
  const entry = 6 + 16 * index;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt8(0, entry + 2);
  header.writeUInt8(0, entry + 3);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(data.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += data.length;
});
writeFileSync(join(root, "src/app/favicon.ico"), Buffer.concat([header, ...images.map(({ data }) => data)]));
console.log("Wrote src/app/favicon.ico");

const css = readFileSync(join(root, "src/app/globals.css"), "utf8");

// The Open Graph image placeholder, 1200x630: the logo at full height, its edge pixels repeated out to the sides so
// no square edge shows. Next adds the og:image tags from the file name. Replace it with a designed image later.
await sharp(logo)
  .resize(630, 630)
  .extend({ left: 285, right: 285, extendWith: "copy" })
  .png({ compressionLevel: 9 })
  .toFile(join(root, "src/app/opengraph-image.png"));
console.log("Wrote src/app/opengraph-image.png");

// The notification badge, unchanged: a white "i" in the app font on transparent.
const onPrimary = css.match(/--on-primary:\s*(#[0-9a-fA-F]{6})\s*;/)?.[1];
if (!onPrimary) throw new Error("Color token --on-primary was not found in globals.css.");
// Embedded as a data URL: a page made with setContent cannot load file:// fonts.
const fontUrl = `data:font/ttf;base64,${readFileSync(join(root, "public/fonts/PlusJakartaSans-Bold.ttf")).toString("base64")}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 72, height: 72 } });
await page.setContent(`<!doctype html>
  <style>
    @font-face { font-family: "Plus Jakarta Sans"; src: url("${fontUrl}"); font-weight: 700; }
    html, body { margin: 0; width: 72px; height: 72px; }
    body { display: flex; align-items: center; justify-content: center; background: transparent; }
    span { font-family: "Plus Jakarta Sans"; font-weight: 700; color: ${onPrimary}; line-height: 1; }
  </style>
  <span id="mark">i</span>`);
await page.evaluate(() => document.fonts.ready);
// Scale the letter so its width is 30% of the badge.
await page.evaluate(() => {
  const mark = document.getElementById("mark");
  mark.style.fontSize = "100px";
  mark.style.fontSize = `${(100 * 72 * 0.3) / mark.getBoundingClientRect().width}px`;
});
await page.screenshot({ path: join(outDir, "badge-72.png"), omitBackground: true });
await browser.close();
console.log("Wrote public/icons/badge-72.png");
