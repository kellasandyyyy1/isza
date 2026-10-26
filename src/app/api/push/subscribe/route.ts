import { subscribeBodySchema } from "@/lib/pushApi";
import { json, readBody, serverError } from "@/server/http";
import { upsertSubscription } from "@/server/push-db";

// Saves this device's push subscription. Stores no health data.
export async function POST(request: Request) {
  const body = await readBody(request, subscribeBodySchema);
  if (!body.ok) return body.response;
  try {
    await upsertSubscription(body.data);
    return json({ ok: true });
  } catch (error) {
    return serverError("subscribe", error);
  }
}
