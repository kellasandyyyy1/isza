import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { MetadataRoute } from "next";
import { readColorToken } from "@/lib/tokens";

// Colors come from the design tokens in globals.css, read when the app is built.
export default function manifest(): MetadataRoute.Manifest {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
  return {
    name: "Iszacycle",
    short_name: "Iszacycle",
    description: "Sync your training, food and rest with your cycle.",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    theme_color: readColorToken(css, "bg"),
    background_color: readColorToken(css, "bg"),
    // Built from assets/icons/app-logo.png by `npm run icons`.
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
