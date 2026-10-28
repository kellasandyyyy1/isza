import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COLOR_TOKENS,
  CONTRAST_PAIRS,
  contrastRatio,
  FERTILE_BAND_PERCENT,
  mixHex,
  PHASE_COLORS,
  PHASE_TINT_PERCENT,
  TEXT_RATIO,
  TINT_BASES,
  type ThemeName,
} from "@/lib/tokens";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

// The body of the first block whose selector line matches, for example ':root,\n[data-theme="light"] {'.
function block(selector: RegExp): string {
  const match = css.match(new RegExp(`${selector.source}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`No block for ${selector.source} in globals.css.`);
  return match[1];
}

// Token values from one theme block, with var(--x) resolved inside the same block.
function tokensIn(body: string): Map<string, string> {
  const values = new Map<string, string>();
  for (const [, name, value] of body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) values.set(name, value.trim());
  for (const [name, value] of values) {
    const reference = value.match(/^var\(--([a-z0-9-]+)\)$/);
    if (reference) values.set(name, values.get(reference[1]) ?? value);
  }
  return values;
}

const BLOCKS: { theme: ThemeName; label: string; body: string }[] = [
  { theme: "light", label: "light", body: block(/:root,\s*\[data-theme="light"\]/) },
  { theme: "dark", label: "dark (system)", body: block(/:root:not\(\[data-theme="light"\]\)/) },
  { theme: "dark", label: "dark (toggle)", body: block(/\n\[data-theme="dark"\]/) },
];

describe("globals.css matches src/lib/tokens.ts", () => {
  for (const { theme, label, body } of BLOCKS) {
    it(`has the same ${label} values`, () => {
      const values = tokensIn(body);
      for (const [name, value] of Object.entries(COLOR_TOKENS[theme])) {
        expect(values.get(name)?.toUpperCase(), `--${name}`).toBe(value.toUpperCase());
      }
    });
  }
});

describe("phase colors match globals.css", () => {
  it("has the same phase colors", () => {
    // The first ":root {" block holds the theme-independent phase colors.
    const values = tokensIn(block(/\n:root/));
    for (const [phase, value] of Object.entries(PHASE_COLORS)) {
      expect(values.get(`phase-${phase}`)?.toUpperCase(), `--phase-${phase}`).toBe(value);
    }
  });

  it(`mixes every phase tint at ${PHASE_TINT_PERCENT}%`, () => {
    for (const phase of Object.keys(PHASE_COLORS)) {
      expect(css).toContain(
        `--color-phase-${phase}-tint: color-mix(in srgb, var(--phase-${phase}) ${PHASE_TINT_PERCENT}%, transparent);`,
      );
    }
  });
});

describe("contrast", () => {
  for (const theme of ["light", "dark"] as const) {
    for (const { fg, bg, min } of CONTRAST_PAIRS) {
      it(`${theme}: --${fg} on --${bg} is at least ${min}:1`, () => {
        const tokens = COLOR_TOKENS[theme];
        expect(contrastRatio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(min);
      });
    }
  }

  for (const theme of ["light", "dark"] as const) {
    for (const [phase, color] of Object.entries(PHASE_COLORS)) {
      for (const base of TINT_BASES) {
        it(`${theme}: --ink-muted on the ${phase} tint over --${base} is at least ${TEXT_RATIO}:1`, () => {
          const tokens = COLOR_TOKENS[theme];
          const tint = mixHex(color, tokens[base], PHASE_TINT_PERCENT);
          expect(contrastRatio(tokens["ink-muted"], tint)).toBeGreaterThanOrEqual(TEXT_RATIO);
        });
      }
    }
  }

  // The band is see-through: checked over the page and over a selected day, the two places it sits.
  for (const theme of ["light", "dark"] as const) {
    for (const base of ["bg", "selected-bg"] as const) {
      it(`${theme}: --fertile-ink on the fertile band over --${base} is at least ${TEXT_RATIO}:1`, () => {
        const tokens = COLOR_TOKENS[theme];
        const band = mixHex(PHASE_COLORS.ovulatory, tokens[base], FERTILE_BAND_PERCENT[theme]);
        expect(contrastRatio(tokens["fertile-ink"], band)).toBeGreaterThanOrEqual(TEXT_RATIO);
      });
    }
  }

  it("mixes the fertile band at the same share as globals.css", () => {
    for (const { theme, label, body } of BLOCKS) {
      expect(body, label).toContain(
        `--fertile-band: color-mix(in srgb, var(--phase-ovulatory) ${FERTILE_BAND_PERCENT[theme]}%, transparent);`,
      );
    }
  });

  it("computes known ratios", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBe(1);
  });
});
