// Fails the build if a font size under 13px appears in src.
// Checks the type tokens and font-size in CSS, Tailwind arbitrary text sizes, Tailwind's default
// small sizes (text-xs, text-2xs) and inline fontSize styles.
// The PDF report is skipped: its sizes are print points on paper, not screen pixels.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const MIN_PX = 13;
const ROOT_FONT_PX = 16;

const root = process.cwd();
const extensions = new Set([".css", ".ts", ".tsx", ".js", ".mjs"]);
const skipped = ["src/components/insights/report/"];

function collectFiles(path) {
  if (!existsSync(path)) return [];
  if (statSync(path).isFile()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => collectFiles(join(path, entry.name)));
}

function toPx(value, unit) {
  const number = Number(value);
  return unit === "px" || unit === undefined ? number : number * ROOT_FONT_PX;
}

// Each rule finds a size on one line and returns it in px.
const rules = [
  // --text-caption: 12px; and font-size: 0.7rem; in CSS.
  { pattern: /(?:--text-[a-z-]+(?<!--line-height)(?<!--font-weight)|font-size)\s*:\s*([\d.]+)(px|rem|em)\b/g },
  // text-[11px], text-[0.7rem], text-[length:11px]
  { pattern: /\btext-\[(?:length:)?([\d.]+)(px|rem|em)\]/g },
  // fontSize: 11 or fontSize: "11px" in inline styles.
  { pattern: /\bfontSize\s*:\s*["']?([\d.]+)(px|rem|em)?\b/g },
  // Tailwind's default small sizes, always under 13px.
  { pattern: /\btext-(2xs|xs)\b/g, fixedPx: 12 },
];

const hits = [];
for (const file of collectFiles(join(root, "src"))) {
  const path = relative(root, file).replaceAll("\\", "/");
  if (!extensions.has(extname(file)) || skipped.some((prefix) => path.startsWith(prefix))) continue;
  readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach((line, index) => {
      for (const { pattern, fixedPx } of rules) {
        for (const match of line.matchAll(pattern)) {
          const px = fixedPx ?? toPx(match[1], match[2]);
          if (px < MIN_PX) hits.push(`${path}:${index + 1}  ${match[0]} (${px}px)`);
        }
      }
    });
}

if (hits.length > 0) {
  console.error(`Font size under ${MIN_PX}px found. Use the caption (13px) or small (14px) token instead:`);
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}

console.log(`No font sizes under ${MIN_PX}px found.`);
