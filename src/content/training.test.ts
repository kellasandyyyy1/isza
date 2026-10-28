import { describe, expect, it } from "vitest";
import { phaseNote, presetByType, suggestedByBand } from "./training";

describe("training content", () => {
  it("suggests a main and a second session for every band", () => {
    expect(Object.keys(suggestedByBand)).toEqual(["Go", "Steady", "Rest"]);
    expect(suggestedByBand.Go.main).toEqual({ type: "strength", title: "Heavy strength", durationMin: 45, effort: "7 to 8" });
    expect(suggestedByBand.Rest.alt).toEqual({ type: "rest", title: "Full rest", durationMin: 0, effort: "0" });
  });

  it("has a preset for every swap chip", () => {
    expect(Object.keys(presetByType)).toEqual(["strength", "hiit", "cardio", "mobility", "rest"]);
    expect(presetByType.hiit).toEqual({ durationMin: 25, effort: 8 });
  });

  it("adds a note only for the ovulatory phase and late luteal days", () => {
    expect(phaseNote("ovulatory", false)).toBe("Warm up for 10 minutes first.");
    expect(phaseNote("luteal", true)).toBe("You may want to lower the intensity a notch.");
    expect(phaseNote("luteal", false)).toBeNull();
    expect(phaseNote("follicular", false)).toBeNull();
    expect(phaseNote(null, false)).toBeNull();
  });
});
