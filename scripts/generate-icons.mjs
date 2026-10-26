// Generates placeholder app icons: the lowercase "isza" wordmark on --primary.
// Run with `npm run icons`. Replace the files in public/icons with the final logo later.
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const root = process.cwd();
const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
// Light values come first in globals.css.
const token = (name) => {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`));
  if (!match) throw new Error(`Color token --${name} was not found in globals.css.`);
  return match[1];
};
// Embedded as a data URL: a page made with setContent cannot load file:// fonts.
const fontUrl = `data:font/ttf;base64,${readFileSync(join(root, "public/fonts/PlusJakartaSans-Bold.ttf")).toString("base64")}`;
const outDir = join(root, "public/icons");
mkdirSync(outDir, { recursive: true });

// Maskable icons keep the wordmark inside the central safe zone (a circle 80% wide).
// The notification badge is monochrome: Android uses only its alpha channel, so it is white on transparent.
const icons = [
  { file: "icon-192.png", size: 192, textWidth: 0.7, text: "isza", background: token("primary"), color: token("on-primary") },
  { file: "icon-512.png", size: 512, textWidth: 0.7, text: "isza", background: token("primary"), color: token("on-primary") },
  { file: "icon-maskable-512.png", size: 512, textWidth: 0.5, text: "isza", background: token("primary"), color: token("on-primary") },
  { file: "badge-72.png", size: 72, textWidth: 0.3, text: "i", background: "transparent", color: token("on-primary") },
];

const browser = await chromium.launch();
for (const { file, size, textWidth, text, background, color } of icons) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<!doctype html>
    <style>
      @font-face { font-family: "Plus Jakarta Sans"; src: url("${fontUrl}"); font-weight: 700; }
      html, body { margin: 0; width: ${size}px; height: ${size}px; }
      body { display: flex; align-items: center; justify-content: center; background: ${background}; }
      span { font-family: "Plus Jakarta Sans"; font-weight: 700; color: ${color}; line-height: 1; }
    </style>
    <span id="mark">${text}</span>`);
  await page.evaluate(() => document.fonts.ready);
  // Scale the text so its width is the wanted share of the icon.
  await page.evaluate((target) => {
    const mark = document.getElementById("mark");
    mark.style.fontSize = "100px";
    mark.style.fontSize = `${(100 * target) / mark.getBoundingClientRect().width}px`;
  }, size * textWidth);
  await page.screenshot({ path: join(outDir, file), omitBackground: background === "transparent" });
  await page.close();
  console.log(`Wrote public/icons/${file}`);
}
await browser.close();
