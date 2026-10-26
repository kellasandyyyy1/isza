// Checks the format of the Web Push secrets in .env.local (or the environment) without printing them.
// Prints only PASS or FAIL per item. Run with `npm run check:secrets`. Not part of `npm run check`,
// because CI has no secrets.
import nextEnv from "@next/env";

// Loads .env, .env.local and friends the same way Next.js does, quietly.
nextEnv.loadEnvConfig(process.cwd(), false, { info: () => {}, error: () => {} });

const env = process.env;
const BASE64URL = /^[A-Za-z0-9_-]+$/;

// Byte length of a base64url string, or -1 if it is not clean base64url (spaces, line breaks, padding).
function decodedLength(value) {
  if (!value || !BASE64URL.test(value)) return -1;
  return Buffer.from(value, "base64url").length;
}

const publicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const publicBytes = BASE64URL.test(publicKey) ? Buffer.from(publicKey, "base64url") : Buffer.alloc(0);

const checks = [
  ["CRON_SECRET is at least 32 characters", (env.CRON_SECRET ?? "").length >= 32],
  ["NEXT_PUBLIC_VAPID_PUBLIC_KEY decodes to 65 bytes starting with 0x04", publicBytes.length === 65 && publicBytes[0] === 0x04],
  ["VAPID_PRIVATE_KEY decodes to 32 bytes", decodedLength(env.VAPID_PRIVATE_KEY) === 32],
  ["VAPID_SUBJECT starts with mailto: or https://", /^(mailto:|https:\/\/)/.test(env.VAPID_SUBJECT ?? "")],
  [
    "No secret is exposed with a NEXT_PUBLIC_ name (only the public key may be)",
    ["NEXT_PUBLIC_VAPID_PRIVATE_KEY", "NEXT_PUBLIC_CRON_SECRET", "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"].every(
      (name) => env[name] === undefined,
    ),
  ],
];

let failed = 0;
for (const [label, passed] of checks) {
  if (!passed) failed += 1;
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}`);
}
process.exit(failed === 0 ? 0 : 1);
