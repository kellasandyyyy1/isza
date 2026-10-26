import { describe, expect, it } from "vitest";
import type { Supply } from "@/db/schema";
import type { CycleState } from "./cycle";
import { isLow, lowSupplyAlert } from "./supplies";

const TODAY = "2026-10-25";
const cycleWithNext = (start: string | null) => ({ nextPeriod: start ? { start, earliest: start, latest: start } : null }) as CycleState;

const pads: Supply = { id: 1, kind: "pads", label: "Night pads", count: 3, lowAt: 4 };
const tampons: Supply = { id: 2, kind: "tampons", label: "Tampons", count: 20, lowAt: 5 };

describe("isLow", () => {
  it("is low at or below the low number", () => {
    expect(isLow(pads)).toBe(true);
    expect(isLow({ ...pads, count: 4 })).toBe(true);
    expect(isLow({ ...pads, count: 5 })).toBe(false);
  });
});

describe("lowSupplyAlert", () => {
  it("names the first low supply when a period is predicted within 5 days", () => {
    expect(lowSupplyAlert(cycleWithNext("2026-10-30"), [tampons, pads], TODAY)).toBe("Running low on Night pads");
    expect(lowSupplyAlert(cycleWithNext(TODAY), [pads], TODAY)).toBe("Running low on Night pads");
  });

  it("stays quiet further out, after the predicted day, without a prediction or without low supplies", () => {
    expect(lowSupplyAlert(cycleWithNext("2026-10-31"), [pads], TODAY)).toBeNull();
    expect(lowSupplyAlert(cycleWithNext("2026-10-24"), [pads], TODAY)).toBeNull();
    expect(lowSupplyAlert(cycleWithNext(null), [pads], TODAY)).toBeNull();
    expect(lowSupplyAlert(cycleWithNext("2026-10-27"), [tampons], TODAY)).toBeNull();
  });
});
