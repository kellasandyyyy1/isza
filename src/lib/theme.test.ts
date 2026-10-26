import { afterEach, describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY, parseThemePreference, themeInitScript } from "./theme";

describe("parseThemePreference", () => {
  it("accepts light and dark", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
  });

  it("falls back to system for missing or unknown values", () => {
    expect(parseThemePreference(null)).toBe("system");
    expect(parseThemePreference("blue")).toBe("system");
  });
});

describe("themeInitScript", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("applies a saved theme to the html element", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    new Function(themeInitScript)();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("leaves the attribute unset when following the system", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "nonsense");
    new Function(themeInitScript)();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});
