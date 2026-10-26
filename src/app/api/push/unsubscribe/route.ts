import { deviceBodySchema } from "@/lib/pushApi";
import { json, readBody, serverError } from "@/server/http";
import { deleteSubscription } from "@/server/push-db";

// Deletes this device's subscription. Its reminders go with it (on delete cascade).
export async function POST(request: Request) {
  const body = await readBody(request, deviceBodySchema);
  if (!body.ok) return body.response;
  try {
    await deleteSubscription(body.data.deviceId);
    return json({ ok: true });
  } catch (error) {
    return serverError("unsubscribe", error);
  }
}
