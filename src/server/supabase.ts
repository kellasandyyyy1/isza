import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "./env";

let client: SupabaseClient | null = null;

// Service role client. Server only: the browser never talks to Supabase.
export function supabaseAdmin(): SupabaseClient {
  client ??= createClient(serverEnv("SUPABASE_URL"), serverEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
