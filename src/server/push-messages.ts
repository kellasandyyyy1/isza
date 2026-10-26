import "server-only";
import type { PushReminderType } from "@/lib/pushApi";

// The only notification text Isza ever sends. Fixed here on the server: the client never sends text.
// None of it mentions periods, cycles or symptoms, in either mode.

export interface PushMessage {
  title: string;
  body: string;
}

const NORMAL_TITLE = "Isza";
const NORMAL_BODIES: Record<PushReminderType, string> = {
  "check-in": "Time for your daily check-in.",
  pill: "You have a reminder.",
  supplement: "You have a reminder.",
  custom: "You have a reminder.",
  planner: "Take a look at your planner today.",
};
const DISCREET: PushMessage = { title: "Reminder", body: "You have a new reminder." };

export function pushMessage(type: PushReminderType, discreet: boolean): PushMessage {
  return discreet ? DISCREET : { title: NORMAL_TITLE, body: NORMAL_BODIES[type] };
}

// Where a tap on the notification goes.
export function pushUrl(type: PushReminderType): string {
  return type === "check-in" ? "/today?checkin=1" : "/today";
}

// For the development test button only.
export const TEST_MESSAGE: PushMessage = { title: NORMAL_TITLE, body: "This is a test notification." };
