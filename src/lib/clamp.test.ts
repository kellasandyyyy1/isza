import { describe, expect, it } from "vitest";
import { clamp } from "./clamp";

describe("clamp", () => {
  it("keeps values inside the range", () => {
    expect(clamp(40, 0, 100)).toBe(40);
  });

  it("limits values outside the range", () => {
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp(140, 0, 100)).toBe(100);
  });

  it("returns min for non-finite values", () => {
    expect(clamp(Number.NaN, 0, 100)).toBe(0);
    expect(clamp(Number.POSITIVE_INFINITY, 0, 100)).toBe(0);
  });
});
