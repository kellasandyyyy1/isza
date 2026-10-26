import "server-only";

export type ServerEnvName =
  | "NEXT_PUBLIC_VAPID_PUBLIC_KEY"
  | "VAPID_PRIVATE_KEY"
  | "VAPID_SUBJECT"
  | "SUPABASE_URL"
  | "SUPABASE_SERVICE_ROLE_KEY";

// Read when a request needs them, so a missing variable fails that request with a clear log line
// instead of breaking the build.
export function serverEnv(name: ServerEnvName): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return value;
}
