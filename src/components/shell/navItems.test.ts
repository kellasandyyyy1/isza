import { describe, expect, it } from "vitest";
import { isActiveRoute, navItems } from "./navItems";

describe("navItems", () => {
  it("lists the five main routes in order", () => {
    expect(navItems.map((item) => item.label)).toEqual(["Today", "Calendar", "Train", "Insights", "Me"]);
  });
});

describe("isActiveRoute", () => {
  it("matches the route and its sub routes", () => {
    expect(isActiveRoute("/today", "/today")).toBe(true);
    expect(isActiveRoute("/today/details", "/today")).toBe(true);
  });

  it("does not match other routes that share a prefix", () => {
    expect(isActiveRoute("/train", "/today")).toBe(false);
    expect(isActiveRoute("/meals", "/me")).toBe(false);
  });
});
