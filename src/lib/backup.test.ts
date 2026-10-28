import { describe, expect, it } from "vitest";
import { generateDemoData } from "@/dev/seed";
import { backupFileName, parseBackup } from "./backup";

describe("backupFileName", () => {
  it("names the file by date", () => {
    expect(backupFileName("2026-10-25")).toBe("iszacycle-backup-2026-10-25.json");
  });
});

describe("parseBackup", () => {
  it("accepts an Iszacycle backup and counts what it holds", () => {
    const demo = generateDemoData(new Date(2026, 9, 25));
    const result = parseBackup(JSON.stringify(demo));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual(demo);
      expect(result.counts).toEqual({ periods: 5, checkIns: 125, workouts: 53, supplies: 0, reminders: 0 });
    }
  });

  it("rejects text that is not JSON", () => {
    expect(parseBackup("not json")).toEqual({ ok: false, error: "This file is not a valid backup file." });
  });

  it("rejects JSON that is not a valid backup", () => {
    expect(parseBackup(JSON.stringify({ version: 1 }))).toEqual({
      ok: false,
      error: "This file is not an Iszacycle backup, or it is damaged.",
    });
    const demo = generateDemoData(new Date(2026, 9, 25));
    expect(parseBackup(JSON.stringify({ ...demo, version: 2 })).ok).toBe(false);
  });
});
