# Isza

Isza syncs your hormonal cycle with your training, nutrition, energy and daily life. Every morning it shows your cycle day, phase and readiness score, with a simple plan for training, food, work and rest. A 20-second check-in helps it learn your personal patterns over time.

Your data stays on this device. We never sell or share it.

Isza is not a medical device or a contraceptive.

## Run locally

Requires Node.js 24 or later.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Checks

```bash
npm run check
```

This runs, in order:

- `npm run typecheck`: TypeScript in strict mode
- `npm run lint`: ESLint
- `npm run test`: unit tests with Vitest
- `npm run check:dashes`: fails if an em dash or en dash appears in src/, scripts/, tests/ or this README

End-to-end tests run separately with Playwright, on mobile (390x844) and desktop (1440x900) Chromium:

```bash
npx playwright install chromium
npm run e2e
```

Offline and install tests need a production build with the service worker, so they run on their own:

```bash
npm run e2e:pwa
```

## Push notifications (optional)

Reminders show inside the app without any server. Real notifications while the app is closed use Web Push, with a small server part: Next.js route handlers under `src/app/api/push/` and a Supabase Postgres database.

The server stores only a random device ID, the push subscription, the time zone, the discreet flag and reminder times. Never labels, notes, cycle days, phases, predictions, symptoms or any log data. Notification text is fixed on the server and never mentions periods, cycles or symptoms.

### Environment variables

Copy `.env.example` to `.env.local` and fill it in. Never commit real values, and never put them in `.env.example`.

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`: generate the pair with `npx web-push generate-vapid-keys`.
- `VAPID_SUBJECT`: a `mailto:` address push services can use to reach you.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: from the Supabase project settings. The service role key is used only on the server.
- `CRON_SECRET`: a long random string. Supabase sends it to `/api/push/send`. Store the same value in Supabase Vault under the name `cron_secret`.

### Database

Run `supabase/migrations/0001_push.sql` in the Supabase SQL editor. After deploying, store `cron_secret` in Vault, replace `YOUR_DOMAIN` in `supabase/migrations/0002_cron.sql` and run it. It calls `/api/push/send` every 5 minutes.

### Checking the secrets

`npm run check:secrets` checks the format of the values in `.env.local` and prints only PASS or FAIL, never the values. It is not part of `npm run check`, because CI has no secrets.

### Rotating CRON_SECRET

1. Generate a new value with `openssl rand -hex 32`.
2. Update `CRON_SECRET` in Vercel (Production and Preview) and redeploy with `vercel --prod`.
3. Update the Vault copy in the Supabase SQL editor, with the new value in place of `NEW_VALUE`:
   `select vault.update_secret((select id from vault.secrets where name = 'cron_secret'), 'NEW_VALUE');`

Change both together. Until Vercel and Vault match, every reminder run gets 401.

### Changing VAPID keys

Every push subscription is tied to the public key it was created with. New keys make all current subscriptions fail, so every user must turn notifications off and on again. Rotate only if the private key leaked, and afterwards delete all rows from `push_subscriptions` (`delete from push_subscriptions;`, reminders go with them).

### Trying push locally

The service worker is off in development. To try push on localhost:

1. Set `NEXT_PUBLIC_SW_IN_DEV=1` in `.env.local`.
2. In one terminal run `npx serwist build serwist.config.mjs --watch` (builds the worker without a precache).
3. In another run `npm run dev`.
4. Turn on "Notifications on this device" in Me > Reminders, then use "Send test push to this device" on `/dev/ui`.

Run `npm run build` before deploying so `public/sw.js` is the production worker again.
