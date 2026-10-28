// Request bodies for /api/push/*. Shared by the client (to build them) and the server (to check them).
// Every object is strict: an extra field such as a label or a note makes the request invalid.
import { z } from "zod";

export const MAX_PUSH_REMINDERS = 20;
export const MAX_PUSH_BODY_BYTES = 8 * 1024;

export const PUSH_REMINDER_TYPES = ["check-in", "pill", "supplement", "custom", "planner", "water"] as const;
export type PushReminderType = (typeof PUSH_REMINDER_TYPES)[number];

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const deviceIdSchema = z.uuid();
const timezoneSchema = z.string().min(1).max(64).refine(isTimeZone, "Unknown time zone.");
const reminderTypeSchema = z.enum(PUSH_REMINDER_TYPES);

export const pushReminderSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("recurring"),
    reminderType: reminderTypeSchema,
    timeLocal: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    days: z
      .array(z.number().int().min(0).max(6))
      .min(1)
      .max(7)
      .refine((days) => new Set(days).size === days.length, "Each day can appear once."),
  }),
  z.strictObject({
    kind: z.literal("once"),
    reminderType: reminderTypeSchema,
    sendAt: z.iso.datetime(),
  }),
]);
export type PushReminder = z.infer<typeof pushReminderSchema>;

export const subscribeBodySchema = z.strictObject({
  deviceId: deviceIdSchema,
  subscription: z.strictObject({
    endpoint: z.url({ protocol: /^https$/ }).max(2048),
    keys: z.strictObject({
      p256dh: z.string().min(1).max(256),
      auth: z.string().min(1).max(64),
    }),
  }),
  timezone: timezoneSchema,
  discreet: z.boolean(),
});
export type SubscribeBody = z.infer<typeof subscribeBodySchema>;

export const syncBodySchema = z.strictObject({
  deviceId: deviceIdSchema,
  timezone: timezoneSchema,
  discreet: z.boolean(),
  reminders: z.array(pushReminderSchema).max(MAX_PUSH_REMINDERS),
});
export type SyncBody = z.infer<typeof syncBodySchema>;

export const deviceBodySchema = z.strictObject({ deviceId: deviceIdSchema });
export type DeviceBody = z.infer<typeof deviceBodySchema>;
