import { describe, expect, it } from "vitest";
import { cx } from "./cx";

describe("cx", () => {
  it("joins truthy class names with spaces", () => {
    expect(cx("a", "b")).toBe("a b");
  });

  it("skips falsy values", () => {
    expect(cx("a", false, null, undefined, "", "b")).toBe("a b");
  });
});
