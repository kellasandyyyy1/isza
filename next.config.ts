import type { NextConfig } from "next";
import packageJson from "./package.json";

const isDev = process.env.NODE_ENV === "development";

// Everything from this origin only: no third-party scripts, styles, fonts, images or requests.
// 'unsafe-inline' for scripts: Next.js bootstraps every page with inline scripts, and the theme script runs
// inline before first paint. Nonces would make every page dynamic, so the service worker could not precache pages
// for offline use. 'unsafe-inline' for styles: motion and vaul set inline styles.
// 'wasm-unsafe-eval': the doctor report's layout engine (yoga-layout) compiles WebAssembly. It allows no JS eval.
// In development React also needs 'unsafe-eval' for its debugging tools.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  // data: for inline SVG backgrounds, blob: for the report and backup downloads.
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Content-Type-Options", value: "nosniff" },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Shown in Me, About Iszacycle.
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
