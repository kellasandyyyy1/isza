import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { db } from "../src/db/db";

// The product is Iszacycle. The bare word "isza" may appear only where renaming would break something: the legacy
// Dexie database name (and code that opens it), and the saved theme key. Comments do not render, so they may
// mention the legacy name too.
const ALLOWED = [/new Dexie\("isza"\)/, /indexedDB\.open\("isza"\)/, /"isza-theme"/];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("the product name", () => {
  const root = join(__dirname, "..");
  const files = sourceFiles(join(root, "src"));

  it("never shows the bare word Isza in the app's source", () => {
    const offenders: string[] = [];
    for (const file of files) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, index) => {
          if (!/\bisza\b/i.test(line)) return;
          if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;
          if (ALLOWED.some((pattern) => pattern.test(line))) return;
          offenders.push(`${relative(root, file)}:${index + 1}: ${line.trim()}`);
        });
    }
    expect(offenders).toEqual([]);
  });

  it("says Iszacycle in the content files", () => {
    const text = readFileSync(join(root, "src/content/legal.ts"), "utf8");
    expect(text).toContain("Iszacycle is not a medical device or a contraceptive.");
  });

  it("keeps the legacy database name, so existing data still opens", () => {
    expect(db.name).toBe("isza");
  });
});
