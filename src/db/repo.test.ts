import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { allTables, db } from "./db";
import {
  DEFAULT_MEAL_SETTINGS,
  DataValidationError,
  RecordNotFoundError,
  addMealHistory,
  getMealSettings,
  listMealHistory,
  saveMealSettings,
  swapMeal,
  changeWaterCount,
  getWaterLog,
  getWaterSettings,
  saveWaterSettings,
  addPeriod,
  addReminder,
  addSupply,
  addWorkout,
  clearAppLock,
  completeOnboarding,
  deleteAll,
  dismissFlag,
  exportAll,
  getAppLock,
  getDeviceSetting,
  getLog,
  getProfile,
  importAll,
  listLogs,
  listPeriods,
  listWorkouts,
  saveCheckIn,
  saveProfile,
  setAppLock,
  setDeviceSetting,
  updatePeriod,
  updateSupply,
  upsertLog,
} from "./repo";
import type { Profile, Reminder } from "./schema";

const profile: Profile = {
  id: "me",
  name: "Mia",
  goals: ["train"],
  contraception: "none",
  typicalCycleLength: 28,
  typicalPeriodLength: 5,
  activityLevel: "moderate",
  workoutTypes: ["strength"],
  onboardingComplete: true,
  discreetMode: false,
  createdAt: "2026-01-01T08:00:00.000Z",
};

async function fillEveryTable() {
  await saveProfile(profile);
  await addPeriod({ startDate: "2026-09-01", endDate: "2026-09-05" });
  await upsertLog({ date: "2026-09-02", bleeding: "heavy", symptoms: [{ key: "cramps", severity: 2 }] });
  await addWorkout({ date: "2026-09-03", type: "strength", durationMin: 45, rpe: 7, feel: "strong", note: null });
  await addSupply({ kind: "pads", label: "Night pads", count: 12, lowAt: 4 });
  await addReminder({ type: "check-in", label: "Evening check-in", time: "20:30", days: [0, 1, 2], enabled: true });
  await dismissFlag("long-cycle", 30, new Date(2026, 8, 10));
  await db.settings.put({ key: "units", value: "metric" });
  await addMealHistory({ date: "2026-09-04", mealId: "tapsilog", action: "cooked" });
  await changeWaterCount("2026-09-04", 1);
}

beforeEach(async () => {
  await deleteAll();
});

describe("validation", () => {
  it("rejects a profile with an unknown goal", async () => {
    await expect(saveProfile({ ...profile, goals: ["fly" as never] })).rejects.toThrow(DataValidationError);
  });

  it("rejects dates that are not yyyy-MM-dd", async () => {
    await expect(addPeriod({ startDate: "01/09/2026", endDate: null })).rejects.toThrow(DataValidationError);
    await expect(upsertLog({ date: "2026-13-01" })).rejects.toThrow(DataValidationError);
  });

  it("rejects a period that ends before it starts", async () => {
    await expect(addPeriod({ startDate: "2026-09-10", endDate: "2026-09-01" })).rejects.toThrow(
      /End date cannot be before the start date/,
    );
  });

  it("rejects out of range log and workout values", async () => {
    await expect(upsertLog({ date: "2026-09-01", energy: 6 as never })).rejects.toThrow(DataValidationError);
    await expect(
      addWorkout({ date: "2026-09-01", type: "cardio", durationMin: 30, rpe: 11, feel: "normal", note: null }),
    ).rejects.toThrow(DataValidationError);
  });

  it("rejects a reminder with a bad time or day", async () => {
    const reminder: Omit<Reminder, "id"> = { type: "pill", label: "Pill", time: "8:00", days: [1], enabled: true };
    await expect(addReminder(reminder)).rejects.toThrow(DataValidationError);
    await expect(addReminder({ ...reminder, time: "08:00", days: [7] })).rejects.toThrow(DataValidationError);
  });

  it("names the invalid field in the error message", async () => {
    await expect(addSupply({ kind: "pads", label: "", count: -1, lowAt: 2 })).rejects.toThrow(/label[\s\S]*count/);
  });

  it("does not write anything when validation fails", async () => {
    await expect(upsertLog({ date: "2026-09-01", sleepHours: 30 })).rejects.toThrow(DataValidationError);
    expect(await getLog("2026-09-01")).toBeNull();
  });

  it("throws a readable error when updating a missing record", async () => {
    await expect(updatePeriod(999, { endDate: null })).rejects.toThrow(RecordNotFoundError);
    await expect(updateSupply(999, { count: 1 })).rejects.toThrow("No supply found with id 999.");
  });
});

describe("upsertLog", () => {
  it("creates a log with empty defaults", async () => {
    const log = await upsertLog({ date: "2026-09-01", mood: "good" });
    expect(log).toMatchObject({ bleeding: "none", energy: null, mood: "good", symptoms: [], note: null });
  });

  it("merges new fields into the existing log", async () => {
    await upsertLog({ date: "2026-09-01", bleeding: "light", energy: 3, note: "Long day" });
    await upsertLog({ date: "2026-09-01", mood: "low", energy: 2 });
    expect(await getLog("2026-09-01")).toMatchObject({
      bleeding: "light",
      energy: 2,
      mood: "low",
      note: "Long day",
    });
  });

  it("can clear a field back to null", async () => {
    await upsertLog({ date: "2026-09-01", sleepHours: 7.5 });
    await upsertLog({ date: "2026-09-01", sleepHours: null });
    expect((await getLog("2026-09-01"))?.sleepHours).toBeNull();
  });
});

describe("queries", () => {
  it("lists periods sorted by start date", async () => {
    await addPeriod({ startDate: "2026-10-01", endDate: null });
    await addPeriod({ startDate: "2026-08-04", endDate: "2026-08-08" });
    expect((await listPeriods()).map((period) => period.startDate)).toEqual(["2026-08-04", "2026-10-01"]);
  });

  it("lists logs and workouts inclusively between two dates", async () => {
    for (const date of ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"]) await upsertLog({ date });
    expect((await listLogs("2026-09-02", "2026-09-03")).map((log) => log.date)).toEqual(["2026-09-02", "2026-09-03"]);

    const workout = { type: "cardio", durationMin: 30, rpe: 5, feel: "normal", note: null } as const;
    await addWorkout({ ...workout, date: "2026-09-05" });
    await addWorkout({ ...workout, date: "2026-09-01" });
    expect((await listWorkouts("2026-09-01", "2026-09-05")).map((item) => item.date)).toEqual([
      "2026-09-01",
      "2026-09-05",
    ]);
  });

  it("dismisses a flag until a number of days from today", async () => {
    expect(await dismissFlag("late-period", 7, new Date(2026, 9, 25))).toEqual({ id: "late-period", until: "2026-11-01" });
  });
});

describe("export and import", () => {
  it("round-trips every table identically", async () => {
    await fillEveryTable();
    const exported = await exportAll();
    expect(exported.version).toBe(1);

    await deleteAll();
    await importAll(JSON.parse(JSON.stringify(exported)));

    expect(await exportAll()).toEqual(exported);
    expect(await getProfile()).toEqual(profile);
  });

  it("rejects an invalid file and keeps existing data", async () => {
    await fillEveryTable();
    const before = await exportAll();
    await expect(importAll({ ...before, version: 2 })).rejects.toThrow(DataValidationError);
    await expect(importAll({ ...before, dailyLogs: [{ date: "nope" }] })).rejects.toThrow(DataValidationError);
    expect(await exportAll()).toEqual(before);
  });

  it("replaces existing data instead of merging", async () => {
    await fillEveryTable();
    const exported = await exportAll();
    await addPeriod({ startDate: "2026-10-01", endDate: null });
    await importAll(exported);
    expect(await listPeriods()).toHaveLength(1);
  });
});

describe("saveCheckIn", () => {
  it("saving twice on the same day updates the one log", async () => {
    await saveCheckIn({ date: "2026-10-25", energy: 4, mood: "good" }, { type: "none" });
    await saveCheckIn({ date: "2026-10-25", energy: 2 }, { type: "none" });
    expect(await db.dailyLogs.count()).toBe(1);
    expect(await getLog("2026-10-25")).toMatchObject({ energy: 2, mood: "good" });
  });

  it("starts, ends, reopens and removes a period", async () => {
    await saveCheckIn({ date: "2026-10-21" }, { type: "start", startDate: "2026-10-21" });
    const [started] = await listPeriods();
    expect(started).toMatchObject({ startDate: "2026-10-21", endDate: null });
    const id = started.id ?? 0;

    await saveCheckIn({ date: "2026-10-25" }, { type: "end", periodId: id, endDate: "2026-10-25" });
    expect((await listPeriods())[0].endDate).toBe("2026-10-25");

    await saveCheckIn({ date: "2026-10-25" }, { type: "reopen", periodId: id });
    expect((await listPeriods())[0].endDate).toBeNull();

    await saveCheckIn({ date: "2026-10-21" }, { type: "remove", periodId: id });
    expect(await listPeriods()).toEqual([]);
  });

  it("saves nothing when the period change fails", async () => {
    await expect(
      saveCheckIn({ date: "2026-10-25", energy: 3 }, { type: "end", periodId: 999, endDate: "2026-10-25" }),
    ).rejects.toThrow(RecordNotFoundError);
    expect(await getLog("2026-10-25")).toBeNull();
  });
});

describe("completeOnboarding", () => {
  it("saves the profile and the first period", async () => {
    await completeOnboarding(profile, { startDate: "2026-10-10", endDate: "2026-10-14" });
    expect(await getProfile()).toEqual(profile);
    expect(await listPeriods()).toMatchObject([{ startDate: "2026-10-10", endDate: "2026-10-14" }]);
  });

  it("saves nothing when the period is invalid", async () => {
    await expect(completeOnboarding(profile, { startDate: "2026-10-10", endDate: "2026-10-01" })).rejects.toThrow(
      DataValidationError,
    );
    expect(await getProfile()).toBeNull();
    expect(await listPeriods()).toEqual([]);
  });
});

describe("app lock", () => {
  const lock = { salt: "0".repeat(32), hash: "a".repeat(64) };

  it("stores only the salt and hash, and can clear them", async () => {
    expect(await getAppLock()).toBeNull();
    await setAppLock(lock);
    expect(await getAppLock()).toEqual(lock);
    expect(await db.settings.toArray()).toEqual([
      { key: "app-lock-hash", value: lock.hash },
      { key: "app-lock-salt", value: lock.salt },
    ]);
    await clearAppLock();
    expect(await getAppLock()).toBeNull();
  });

  it("rejects anything that is not a hex salt and SHA-256 hash", async () => {
    await expect(setAppLock({ salt: "1234", hash: "1234" })).rejects.toThrow(DataValidationError);
  });

  it("is part of the export, so a restore keeps the lock", async () => {
    await setAppLock(lock);
    const exported = await exportAll();
    await deleteAll();
    expect(await getAppLock()).toBeNull();
    await importAll(exported);
    expect(await getAppLock()).toEqual(lock);
  });
});

describe("push device settings", () => {
  it("are left out of backups and kept through an import", async () => {
    await fillEveryTable();
    await setDeviceSetting("deviceId", "11111111-1111-4111-8111-111111111111");
    await setDeviceSetting("push-last-sync", "{}");
    const exported = await exportAll();
    expect(exported.settings.map((setting) => setting.key)).toEqual(["units"]);

    // A backup from another device that wrongly carries its own device ID.
    const foreign = { ...exported, settings: [...exported.settings, { key: "deviceId", value: "other" }] };
    await importAll(foreign);
    expect(await getDeviceSetting("deviceId")).toBe("11111111-1111-4111-8111-111111111111");
    expect(await getDeviceSetting("push-last-sync")).toBe("{}");
  });

  it("are removed by deleteAll", async () => {
    await setDeviceSetting("deviceId", "11111111-1111-4111-8111-111111111111");
    await deleteAll();
    expect(await getDeviceSetting("deviceId")).toBeNull();
  });
});

describe("deleteAll", () => {
  it("empties every table, meal history included", async () => {
    await fillEveryTable();
    for (const table of allTables()) expect(await table.count()).toBeGreaterThan(0);
    await deleteAll();
    for (const table of allTables()) expect(await table.count()).toBe(0);
  });
});

describe("meal ideas", () => {
  it("starts from the defaults and saves every setting", async () => {
    expect(await getMealSettings()).toEqual(DEFAULT_MEAL_SETTINGS);
    expect(DEFAULT_MEAL_SETTINGS).toEqual({
      mealSuggestionsEnabled: true,
      maxCostTier: 2,
      excludedMealIds: [],
      cuisinePreference: "mixed",
    });
    const changed = {
      mealSuggestionsEnabled: false,
      maxCostTier: 1 as const,
      excludedMealIds: ["tokwat-gulay", "tuna-sandwich"],
      cuisinePreference: "filipino" as const,
    };
    await saveMealSettings(changed);
    expect(await getMealSettings()).toEqual(changed);
  });

  it("falls back to the defaults for values it cannot read", async () => {
    await db.settings.bulkPut([
      { key: "maxCostTier", value: 9 },
      { key: "excludedMealIds", value: "not json" },
      { key: "cuisinePreference", value: "french" },
    ]);
    expect(await getMealSettings()).toEqual(DEFAULT_MEAL_SETTINGS);
  });

  it("keeps every action of a day in the order it happened", async () => {
    await addMealHistory({ date: "2026-10-27", mealId: "tokwat-gulay", action: "skipped" });
    await addMealHistory({ date: "2026-10-26", mealId: "arroz-caldo", action: "shown" });
    await addMealHistory({ date: "2026-10-27", mealId: "tuna-sandwich", action: "shown" });
    await addMealHistory({ date: "2026-10-27", mealId: "tuna-sandwich", action: "cooked" });
    const rows = await listMealHistory("2026-10-26", "2026-10-27");
    expect(rows.map(({ date, mealId, action }) => [date, mealId, action])).toEqual([
      ["2026-10-26", "arroz-caldo", "shown"],
      ["2026-10-27", "tokwat-gulay", "skipped"],
      ["2026-10-27", "tuna-sandwich", "shown"],
      ["2026-10-27", "tuna-sandwich", "cooked"],
    ]);
  });

  it("swaps a meal in one write: the skip, the next meal and the excluded list", async () => {
    await addMealHistory({ date: "2026-10-27", mealId: "tokwat-gulay", action: "shown" });
    await swapMeal("2026-10-27", "tokwat-gulay", "arroz-caldo", { ...DEFAULT_MEAL_SETTINGS, excludedMealIds: ["tokwat-gulay"] });
    const rows = await listMealHistory("2026-10-27", "2026-10-27");
    expect(rows.map(({ mealId, action }) => [mealId, action])).toEqual([
      ["tokwat-gulay", "shown"],
      ["tokwat-gulay", "skipped"],
      ["arroz-caldo", "shown"],
    ]);
    expect((await getMealSettings()).excludedMealIds).toEqual(["tokwat-gulay"]);
  });

  it("rejects an unknown action", async () => {
    await expect(addMealHistory({ date: "2026-10-27", mealId: "arroz-caldo", action: "eaten" as "shown" })).rejects.toThrow(
      DataValidationError,
    );
  });
});

describe("water", () => {
  it("counts taps on one row per day, never below 0", async () => {
    const now = new Date(2026, 9, 27, 10, 0);
    await changeWaterCount("2026-10-27", 1, now);
    await changeWaterCount("2026-10-27", 1, now);
    await changeWaterCount("2026-10-27", 1, now);
    await changeWaterCount("2026-10-27", -1, now);
    expect(await getWaterLog("2026-10-27")).toEqual({ date: "2026-10-27", count: 2, updatedAt: now.toISOString() });
    expect(await db.waterLogs.count()).toBe(1);

    for (let tap = 0; tap < 4; tap++) await changeWaterCount("2026-10-27", -1, now);
    expect((await getWaterLog("2026-10-27"))?.count).toBe(0);
    expect(await getWaterLog("2026-10-28")).toBeNull();
  });

  it("starts with reminders off and saves every setting", async () => {
    const settings = await getWaterSettings();
    expect(settings).toEqual({
      waterRemindersEnabled: false,
      waterWindowStart: "08:00",
      waterWindowEnd: "20:00",
      waterIntervalHours: 3,
      waterGlassMl: 250,
    });
    const changed = { ...settings, waterRemindersEnabled: true, waterWindowStart: "09:30", waterIntervalHours: 2 as const };
    await saveWaterSettings(changed);
    expect(await getWaterSettings()).toEqual(changed);
  });

  it("rejects a window time that is not a clock time", async () => {
    const settings = await getWaterSettings();
    await expect(saveWaterSettings({ ...settings, waterWindowEnd: "25:00" })).rejects.toThrow(DataValidationError);
  });
});
