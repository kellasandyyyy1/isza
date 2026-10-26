import "server-only";
import * as webpush from "web-push";
import { WebPushError } from "web-push";
import { serverEnv } from "./env";
import type { PushMessage } from "./push-messages";
import type { SubscriptionRow } from "./push-db";

// VAPID details are set once, when this module loads. A missing key or a subject that is not
// "mailto:" or "https://" fails right away with a clear server error. Skipped only while
// `next build` loads route modules, so builds without secrets (CI) still work.
const SUBJECT_PATTERN = /^(mailto:|https:\/\/)/;

export function configureVapid(): void {
  const subject = serverEnv("VAPID_SUBJECT");
  if (!SUBJECT_PATTERN.test(subject)) {
    throw new Error("VAPID_SUBJECT must start with mailto: or https://. See .env.example.");
  }
  webpush.setVapidDetails(subject, serverEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY"), serverEnv("VAPID_PRIVATE_KEY"));
}

if (process.env.NEXT_PHASE !== "phase-production-build") configureVapid();

export interface PushPayload extends PushMessage {
  url: string;
  tag: string;
}

// "gone" means the push service no longer knows the subscription (404 or 410).
export type SendResult = "sent" | "gone" | "failed";

export async function sendPush(subscription: SubscriptionRow, payload: PushPayload): Promise<SendResult> {
  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 60 },
    );
    return "sent";
  } catch (error) {
    if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) return "gone";
    // Logs the status only, never the endpoint or keys.
    console.error(`[push] send failed with status ${error instanceof WebPushError ? error.statusCode : "unknown"}`);
    return "failed";
  }
}
