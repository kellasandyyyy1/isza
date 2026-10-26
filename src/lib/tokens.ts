// Reads a light-theme color token from the text of globals.css. Light values come first in that file.
// Used where CSS variables cannot be used, such as the web app manifest.
export function readColorToken(css: string, name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`));
  if (!match) throw new Error(`Color token --${name} was not found in globals.css.`);
  return match[1];
}

export type ColorTokenName =
  | "bg"
  | "surface"
  | "surface-2"
  | "ink"
  | "ink-muted"
  | "primary"
  | "on-primary"
  | "period"
  | "on-period"
  | "selected-bg"
  | "selected-ink";

export type ThemeName = "light" | "dark";

// The theme colors from globals.css, one place for the contrast checks.
// tests/contrast.test.ts fails if these and globals.css ever differ.
export const COLOR_TOKENS: Record<ThemeName, Record<ColorTokenName, string>> = {
  light: {
    bg: "#FFFAF7",
    surface: "#FFFFFF",
    "surface-2": "#F7F1EE",
    ink: "#1F1A1C",
    "ink-muted": "#5E5559",
    primary: "#C2335D",
    "on-primary": "#FFFFFF",
    period: "#B3124F",
    "on-period": "#FFFFFF",
    // var(--surface-2) and var(--ink) in globals.css.
    "selected-bg": "#F7F1EE",
    "selected-ink": "#1F1A1C",
  },
  dark: {
    bg: "#141113",
    surface: "#1E1A1C",
    "surface-2": "#2A2427",
    ink: "#F5EFF1",
    "ink-muted": "#C2B8BD",
    primary: "#F06A92",
    "on-primary": "#1F1A1C",
    period: "#E45D8C",
    "on-period": "#1F1A1C",
    "selected-bg": "#2A2427",
    "selected-ink": "#F5EFF1",
  },
};

// The phase colors, the same in both themes, and the share of them in a phase tint.
export const PHASE_COLORS = {
  menstrual: "#E05A7A",
  follicular: "#48947A",
  ovulatory: "#BD730E",
  luteal: "#8B78C9",
} as const;
export const PHASE_TINT_PERCENT = 14;

// Tint backgrounds sit on these, so muted text is checked on each tint over each of them.
export const TINT_BASES: ColorTokenName[] = ["bg", "surface"];

// The solid color of `percent` of `color` over `base`, like CSS color-mix(in srgb, color percent, base).
export function mixHex(color: string, base: string, percent: number): string {
  const share = percent / 100;
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(color.slice(start, start + 2), 16) * share + parseInt(base.slice(start, start + 2), 16) * (1 - share);
    return Math.round(value).toString(16).padStart(2, "0");
  });
  return `#${channels.join("").toUpperCase()}`;
}

// WCAG AA: 4.5 for text, 3 for UI shapes and large text.
export const TEXT_RATIO = 4.5;
export const UI_RATIO = 3;

export interface ContrastPair {
  fg: ColorTokenName;
  bg: ColorTokenName;
  min: number;
}

// --period is held to the text ratio everywhere, so it also passes as a UI shape.
export const CONTRAST_PAIRS: ContrastPair[] = [
  { fg: "period", bg: "bg", min: TEXT_RATIO },
  { fg: "period", bg: "surface", min: TEXT_RATIO },
  { fg: "period", bg: "surface-2", min: TEXT_RATIO },
  { fg: "on-primary", bg: "primary", min: TEXT_RATIO },
  { fg: "on-period", bg: "period", min: TEXT_RATIO },
  { fg: "selected-ink", bg: "selected-bg", min: TEXT_RATIO },
  { fg: "ink-muted", bg: "bg", min: TEXT_RATIO },
  { fg: "ink-muted", bg: "surface", min: TEXT_RATIO },
  { fg: "ink-muted", bg: "surface-2", min: TEXT_RATIO },
];

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// The WCAG contrast ratio of two "#RRGGBB" colors, from 1 to 21.
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
