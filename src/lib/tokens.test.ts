import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readColorToken } from "./tokens";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

describe("readColorToken", () => {
  it("reads the light values from globals.css", () => {
    expect(readColorToken(css, "primary")).toBe("#C2335D");
    expect(readColorToken(css, "bg")).toBe("#FFFAF7");
    expect(readColorToken(css, "on-primary")).toBe("#FFFFFF");
  });

  it("throws for a token that does not exist", () => {
    expect(() => readColorToken(css, "nope")).toThrow("Color token --nope was not found in globals.css.");
  });
});
