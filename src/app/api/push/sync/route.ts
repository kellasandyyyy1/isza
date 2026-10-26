import { syncBodySchema } from "@/lib/pushApi";
import { json, readBody, serverError } from "@/server/http";
import { replaceReminders } from "@/server/push-db";

// Replaces all reminder times for this device. 404 when the device is not subscribed.
export async function POST(request: Request) {
  const body = await readBody(request, syncBodySchema);
  if (!body.ok) return body.response;
  try {
    const { deviceId, timezone, discreet, reminders } = body.data;
    const found = await replaceReminders(deviceId, timezone, discreet, reminders);
    return found ? json({ ok: true }) : json({ error: "Device not subscribed." }, 404);
  } catch (error) {
    return serverError("sync", error);
  }
}
