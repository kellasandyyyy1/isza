// Used by `serwist build serwist.config.mjs`, which runs after `next build`.
// This is @serwist/next's configurator mode, which works with Turbopack builds.
import { generateGlobPatterns, serwist } from "@serwist/next/config";

export default await serwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // The default patterns skip fonts; next/font files are needed for the app to look right offline.
  globPatterns: [...generateGlobPatterns(".next/"), ".next/static/media/*.woff2"],
  // /dev/ui is a 404 in production builds. Of the mascot images only mascot-today-320.webp is precached;
  // the rest load lazily when a screen shows them.
  globIgnores: [
    ".next/server/app/dev/**",
    "public/mascot/*-{160,640}.*",
    "public/mascot/mascot-{checkin,calendar,train,insights,me}-320.webp",
  ],
});
