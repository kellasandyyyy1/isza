@AGENTS.md

# ISZACYCLE project rules

You are building ISZACYCLE, a production web app that syncs a woman's hormonal cycle with her training, nutrition, energy and daily life. Follow these rules in every step. If a step conflicts with these rules, these rules win.

## 1. PRODUCT IN ONE LINE
Every morning Iszacycle tells the user her cycle day, phase and readiness score, and gives a simple plan for training, food, work and rest. She logs a 20-second check-in, and the app learns her personal patterns over time.

## 2. STACK (use ONLY these; do not add any other dependency without asking me first)
- Next.js (latest stable, App Router) + React + TypeScript (strict mode)
- Tailwind CSS (latest stable)
- @tabler/icons-react for ALL icons
- dexie + dexie-react-hooks for local storage (IndexedDB)
- date-fns for all date math
- zod for all form and data validation
- vaul for mobile bottom sheets
- @radix-ui primitives only where a step names one (dialog, tabs, switch, slider, popover)
- motion (Framer Motion) for small transitions only
- @react-pdf/renderer for the doctor report
- @serwist/next for PWA and offline
- vitest + @testing-library/react for unit tests, @playwright/test for end-to-end tests

Fonts: "Plus Jakarta Sans" via next/font/google. No other fonts.

Approved additions: jsdom and @testing-library/dom (devDependencies, required by vitest jsdom and @testing-library/react).

## 3. ICONS
- Use @tabler/icons-react only. No emoji as icons, no other icon libraries, no hand-drawn SVG icons (the logo and the future mascot are the only exceptions).
- Before using any icon, confirm the exact export name exists in node_modules/@tabler/icons-react. If it does not exist, pick a different existing Tabler icon. Never invent an icon name.
- Default icon props: size 20 (24 in the bottom nav), stroke 1.75.

## 4. COPY AND WRITING RULES
- NEVER use em dashes (U+2014) or en dashes (U+2013) anywhere: UI text, placeholders, comments, docs, commit messages. Use a period, comma or colon instead. `npm run check:dashes` fails the build if one appears.
- UI copy is short, warm and plain. Max 8 words for headings, max 20 words for body lines. No medical jargon without a one-line explanation.
- Use "often" and "you may" for phase guidance, never absolute claims.
- Never diagnose. Health warnings always end with: "Consider talking to a doctor."
- No calorie counts, weight goals or restriction language anywhere.

## 5. UX RULES (straight to the point)
- One primary action per screen, shown as the single filled button.
- Max 2 taps from the Today screen to any core action.
- Progressive disclosure: show the summary, open details in a bottom sheet (mobile) or side panel (desktop). Never a new page for small details.
- Every empty state says what it is and gives one button to fix it.
- Every destructive action asks for confirmation and names exactly what will be deleted.
- No modals on top of modals.

## 6. MOBILE: NO SCROLLING FATIGUE
- The Today screen fits in one viewport with NO vertical scroll on any phone from 360x640 up. Use 100dvh minus the header and bottom nav.
- Other screens use at most one scroll area. Prefer segmented tabs, horizontal snap carousels and bottom sheets over long pages.
- Lists show 5 items, then a "Show more" button. No infinite scroll.
- Forms show one question per screen (onboarding) or fit in one sheet without scrolling (check-in).
- Touch targets are at least 44x44px. Primary actions sit in the bottom third of the screen (thumb zone).

## 7. RESPONSIVE BREAKPOINTS
- Mobile under 640px: bottom tab bar, single column.
- Tablet 640 to 1023px: bottom tab bar, two-column grids where a step says so.
- Desktop 1024px and up: left sidebar nav, content max width 1200px, two or three column layouts.
- Test every screen at 360, 390, 768, 1024 and 1440px wide.

## 8. VISUAL STYLE (Airbnb / Muse inspired)
- Warm, soft, airy. Generous whitespace, large rounded cards (radius 24px), pill buttons (radius 999px), soft shadows, no harsh borders.
- Use only the design tokens from Step 2. No hard-coded colors or spacing in components.
- Light and dark mode, following the system setting with a manual toggle.

## 9. PRIVACY
- All user data stays in IndexedDB on the device. No analytics, no trackers, no third-party scripts, no network calls with user data.
- Show on onboarding and in settings: "Your data stays on this device. We never sell or share it."
- Show in settings and the doctor report: "Iszacycle is not a medical device or a contraceptive."
- Exception: Step 13b Web Push sends only the device ID, push subscription, timezone, discreet flag and reminder schedule. Never health data.

## 10. ANTI-HALLUCINATION RULES
- Build ONLY what the current step asks. Do not add features, screens, settings or packages that are not listed.
- Use the exact file paths, names, types and formulas given. Do not rename or restructure.
- If something is unclear or missing, STOP and ask me one specific question. Do not guess.
- Do not use any API, prop or function you have not verified exists in the installed package version. Check node_modules or the package types first.
- No fake data in production code. Demo data lives only in src/dev/seed.ts and is loaded only by a "Load demo data" button in development mode.
- Never leave TODO comments silently. List anything unfinished at the end of your reply.
- At the end of every step, run `npm run check` and report the result, then list every file you created or changed.

## 11. CODE QUALITY
- TypeScript strict, no `any`. Pure logic lives in src/lib and has unit tests.
- Components are small and named by what they show. One component per file.
- Accessibility: semantic HTML, labels on every input, visible focus rings, color is never the only signal, WCAG AA contrast (4.5:1 text, 3:1 large text and UI).
- Respect prefers-reduced-motion.
