// Fails the build if an em dash (U+2014) or en dash (U+2013) appears in project text files.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const targets = ["src", "scripts", "tests", "README.md"];
const forbidden = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
const binaryExtensions = new Set([
  ".ico", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif",
  ".woff", ".woff2", ".ttf", ".otf", ".pdf",
]);

function collectFiles(path) {
  if (!existsSync(path)) return [];
  if (statSync(path).isFile()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
    collectFiles(join(path, entry.name)),
  );
}

const hits = [];
for (const file of targets.flatMap((target) => collectFiles(join(root, target)))) {
  if (binaryExtensions.has(extname(file).toLowerCase())) continue;
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (forbidden.test(line)) {
      hits.push(`${relative(root, file).replaceAll("\\", "/")}:${index + 1}`);
    }
  });
}

if (hits.length > 0) {
  console.error("Em or en dash found. Use a period, comma or colon instead:");
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}

console.log("No em or en dashes found.");
