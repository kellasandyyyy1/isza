import { deviceBodySchema } from "@/lib/pushApi";
import { json, readBody, serverError } from "@/server/http";
import { getSubscription } from "@/server/push-db";
import { TEST_MESSAGE } from "@/server/push-messages";
import { sendPush } from "@/server/web-push";

// Development only: sends one test notification to this device right away. 404 in production.
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return json({ error: "Not found." }, 404);
  const body = await readBody(request, deviceBodySchema);
  if (!body.ok) return body.response;
  try {
    const subscription = await getSubscription(body.data.deviceId);
    if (!subscription) return json({ error: "Device not subscribed." }, 404);
    const result = await sendPush(subscription, { ...TEST_MESSAGE, url: "/today", tag: "test" });
    return json({ result });
  } catch (error) {
    return serverError("dev-test", error);
  }
}
