import "fake-indexeddb/auto";
import Dexie from "dexie";
import { describe, expect, it } from "vitest";

// The schema as it was at version 1, before meal ideas and the water tally. Kept here so upgrades can be tested
// from real older databases. Never change it: it is what is already on people's devices.
const VERSION_1 = {
  profile: "id",
  periods: "++id, startDate",
  dailyLogs: "date",
  workouts: "++id, date",
  supplies: "++id, kind",
  reminders: "++id, type",
  dismissedFlags: "id",
  settings: "key",
};

describe("upgrading the database to version 3", () => {
  it("opens a version 1 database and upgrades it, keeping every row", async () => {
    const old = new Dexie("isza");
    old.version(1).stores(VERSION_1);
    await old.open();
    await old.table("profile").put({ id: "me", name: "Mia", onboardingComplete: true });
    await old.table("periods").add({ startDate: "2026-08-01", endDate: "2026-08-05" });
    await old.table("dailyLogs").put({ date: "2026-08-02", bleeding: "medium", energy: 2, symptoms: [{ key: "cramps", severity: 2 }] });
    await old.table("workouts").add({ date: "2026-08-03", type: "cardio", durationMin: 30 });
    await old.table("supplies").add({ kind: "tampons", label: "Regular", count: 8, lowAt: 3 });
    await old.table("reminders").add({ type: "pill", label: "Pill", time: "08:00", days: [0, 1, 2, 3, 4, 5, 6], enabled: true });
    await old.table("dismissedFlags").put({ id: "short-cycle", until: "2026-09-01" });
    await old.table("settings").put({ key: "theme", value: "dark" });
    const before = Object.fromEntries(await Promise.all(old.tables.map(async (table) => [table.name, await table.toArray()])));
    expect(old.verno).toBe(1);
    old.close();

    const { db } = await import("./db");
    await db.open();
    expect(db.verno).toBe(3);
    expect(db.tables.map((table) => table.name)).toEqual(expect.arrayContaining(["mealHistory", "waterLogs"]));
    for (const [name, rows] of Object.entries(before)) {
      expect(await db.table(name).toArray(), name).toEqual(rows);
    }
    // The indexes added since version 1 work on the upgraded database.
    expect(await db.mealHistory.where("date").equals("2026-08-04").count()).toBe(0);
    await db.mealHistory.add({ date: "2026-08-04", mealId: "tapsilog", action: "shown" });
    expect(await db.mealHistory.where("date").equals("2026-08-04").count()).toBe(1);
    expect(await db.periods.where("startDate").equals("2026-08-01").count()).toBe(1);
    db.close();
    // A clean slate for the next test.
    await Dexie.delete("isza");
  });

  it("adds the water table and keeps every existing row", async () => {
    const old = new Dexie("isza");
    old.version(1).stores(VERSION_1);
    old.version(2).stores({ mealHistory: "++id, date" });
    await old.open();
    await old.table("profile").put({ id: "me", name: "Mia" });
    await old.table("periods").add({ startDate: "2026-09-01", endDate: "2026-09-05" });
    await old.table("dailyLogs").put({ date: "2026-09-02", bleeding: "heavy", energy: 3 });
    await old.table("workouts").add({ date: "2026-09-03", type: "strength", durationMin: 45 });
    await old.table("supplies").add({ kind: "pads", label: "Night pads", count: 12, lowAt: 4 });
    await old.table("reminders").add({ type: "check-in", label: "Evening", time: "20:30", days: [1], enabled: true });
    await old.table("dismissedFlags").put({ id: "long-cycle", until: "2026-10-10" });
    await old.table("settings").put({ key: "maxCostTier", value: 1 });
    await old.table("mealHistory").add({ date: "2026-09-04", mealId: "tapsilog", action: "cooked" });
    const before = Object.fromEntries(await Promise.all(old.tables.map(async (table) => [table.name, await table.toArray()])));
    expect(old.verno).toBe(2);
    old.close();

    // The app's own database definition, which upgrades on open.
    const { db } = await import("./db");
    await db.open();
    expect(db.verno).toBe(3);
    expect(db.tables.map((table) => table.name)).toContain("waterLogs");
    for (const [name, rows] of Object.entries(before)) {
      expect(await db.table(name).toArray(), name).toEqual(rows);
    }
    expect(await db.waterLogs.count()).toBe(0);
    await db.waterLogs.put({ date: "2026-09-05", count: 2, updatedAt: "2026-09-05T10:00:00.000Z" });
    expect(await db.waterLogs.get("2026-09-05")).toMatchObject({ count: 2 });
    db.close();
  });
});
