import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Shown in Me, About Isza.
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
  partialPrefetching: true,
  // Only the mascot uses next/image, with prebuilt WebP files at exactly these widths
  // (see scripts/build-mascot.mjs), so the srcSet lists exactly 160, 320 and 640.
  images: {
    imageSizes: [160, 320],
    deviceSizes: [640],
  },
  // Every corner overlaps the tab bar or the page header. Compile and runtime errors still show.
  devIndicators: false,
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
