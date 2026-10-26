import { z } from "zod";

// Calendar dates are "yyyy-MM-dd". Timestamps (createdAt, updatedAt) are full ISO date-times.
export const isoDateSchema = z.iso.date();
export const timestampSchema = z.iso.datetime();
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use the HH:mm format.");
const idSchema = z.number().int().positive();

export const goalSchema = z.enum(["train", "energy", "symptoms", "irregular"]);
export const contraceptionSchema = z.enum(["none", "hormonal", "iud-hormonal", "iud-copper", "other"]);
export const bleedingSchema = z.enum(["none", "spotting", "light", "medium", "heavy", "very-heavy"]);
export const moodSchema = z.enum(["great", "good", "okay", "low", "bad"]);
export const symptomKeySchema = z.enum([
  "cramps",
  "headache",
  "bloating",
  "breast-tenderness",
  "acne",
  "back-pain",
  "nausea",
  "fatigue",
  "cravings",
  "irritability",
  "anxiety",
  "insomnia",
]);
export const workoutTypeSchema = z.enum(["strength", "hiit", "cardio", "mobility", "sport", "rest"]);
export const energySchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
export const severitySchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export type Goal = z.infer<typeof goalSchema>;
export type Contraception = z.infer<typeof contraceptionSchema>;
export type Bleeding = z.infer<typeof bleedingSchema>;
export type Mood = z.infer<typeof moodSchema>;
export type SymptomKey = z.infer<typeof symptomKeySchema>;
export type WorkoutType = z.infer<typeof workoutTypeSchema>;
export type Energy = z.infer<typeof energySchema>;
export type Severity = z.infer<typeof severitySchema>;

export const profileSchema = z.object({
  id: z.literal("me"),
  name: z.string().trim().min(1).max(60).nullable(),
  goals: z.array(goalSchema),
  contraception: contraceptionSchema,
  typicalCycleLength: z.number().int().min(15).max(90).nullable(),
  typicalPeriodLength: z.number().int().min(1).max(15).nullable(),
  activityLevel: z.enum(["low", "moderate", "high"]),
  workoutTypes: z.array(workoutTypeSchema),
  onboardingComplete: z.boolean(),
  discreetMode: z.boolean(),
  createdAt: timestampSchema,
});
export type Profile = z.infer<typeof profileSchema>;

export const periodSchema = z
  .object({
    id: idSchema.optional(),
    startDate: isoDateSchema,
    endDate: isoDateSchema.nullable(),
  })
  .refine((period) => period.endDate === null || period.endDate >= period.startDate, {
    message: "End date cannot be before the start date.",
    path: ["endDate"],
  });
export type Period = z.infer<typeof periodSchema>;

export const symptomEntrySchema = z.object({
  key: symptomKeySchema,
  severity: severitySchema,
});
export type SymptomEntry = z.infer<typeof symptomEntrySchema>;

export const dailyLogSchema = z.object({
  date: isoDateSchema,
  bleeding: bleedingSchema,
  energy: energySchema.nullable(),
  mood: moodSchema.nullable(),
  symptoms: z
    .array(symptomEntrySchema)
    .refine((list) => new Set(list.map((entry) => entry.key)).size === list.length, "Each symptom can appear once."),
  sleepHours: z.number().min(0).max(24).nullable(),
  bbt: z.number().min(34).max(42).nullable(),
  lhTest: z.enum(["positive", "negative"]).nullable(),
  note: z.string().max(1000).nullable(),
  updatedAt: timestampSchema,
});
export type DailyLog = z.infer<typeof dailyLogSchema>;

export const workoutSchema = z.object({
  id: idSchema.optional(),
  date: isoDateSchema,
  type: workoutTypeSchema,
  durationMin: z.number().int().min(0).max(1440),
  rpe: z.number().int().min(1).max(10),
  feel: z.enum(["strong", "normal", "weak"]),
  note: z.string().max(1000).nullable(),
});
export type Workout = z.infer<typeof workoutSchema>;

export const supplySchema = z.object({
  id: idSchema.optional(),
  kind: z.enum(["pads", "tampons", "liners", "cup", "painkillers", "other"]),
  label: z.string().trim().min(1).max(60),
  count: z.number().int().min(0),
  lowAt: z.number().int().min(0),
});
export type Supply = z.infer<typeof supplySchema>;

export const reminderSchema = z.object({
  id: idSchema.optional(),
  type: z.enum(["pill", "supplement", "period-prep", "check-in", "custom"]),
  label: z.string().trim().min(1).max(60),
  time: timeSchema,
  days: z
    .array(z.number().int().min(0).max(6))
    .refine((days) => new Set(days).size === days.length, "Each day can appear once."),
  enabled: z.boolean(),
});
export type Reminder = z.infer<typeof reminderSchema>;

export const dismissedFlagSchema = z.object({
  id: z.string().min(1),
  until: isoDateSchema,
});
export type DismissedFlag = z.infer<typeof dismissedFlagSchema>;

// Not specified in Step 4 beyond its key. Holds simple app settings by name.
export const settingSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});
export type Setting = z.infer<typeof settingSchema>;

export const EXPORT_VERSION = 1;

export const exportDataSchema = z.object({
  version: z.literal(EXPORT_VERSION),
  profile: profileSchema.nullable(),
  periods: z.array(periodSchema.and(z.object({ id: idSchema }))),
  dailyLogs: z.array(dailyLogSchema),
  workouts: z.array(workoutSchema.required({ id: true })),
  supplies: z.array(supplySchema.required({ id: true })),
  reminders: z.array(reminderSchema.required({ id: true })),
  dismissedFlags: z.array(dismissedFlagSchema),
  settings: z.array(settingSchema),
});
export type ExportData = z.infer<typeof exportDataSchema>;
