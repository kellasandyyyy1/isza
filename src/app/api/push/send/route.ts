import { cronSecretConfigured, hasCronSecret, json, serverError } from "@/server/http";
import { sendDueReminders } from "@/server/push-send";

// Called every 5 minutes by Supabase pg_cron with exactly "Authorization: Bearer <CRON_SECRET>".
// 500 and nothing sent when CRON_SECRET is missing or too short; 401 for any other header.
// Returns counts only.
export async function POST(request: Request) {
  if (!cronSecretConfigured()) {
    console.error("[push] send refused: CRON_SECRET is missing or shorter than 32 characters.");
    return json({ error: "Server is not configured." }, 500);
  }
  if (!hasCronSecret(request)) return json({ error: "Unauthorized." }, 401);
  try {
    return json(await sendDueReminders(new Date()));
  } catch (error) {
    return serverError("send", error);
  }
}
