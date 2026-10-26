export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "isza-theme";

// Anything other than a saved "light" or "dark" means follow the system setting.
export function parseThemePreference(value: string | null): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

// Runs in <head> before first paint so a saved theme never flashes.
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
