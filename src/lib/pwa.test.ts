import { describe, expect, it } from "vitest";
import { needsIosInstallHint } from "./pwa";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1";
const IPAD_OS = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
const ANDROID = "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/141.0 Mobile Safari/537.36";

describe("needsIosInstallHint", () => {
  it("shows on iPhone and on iPad that reports as a Mac with touch", () => {
    expect(needsIosInstallHint(IPHONE, 5, false)).toBe(true);
    expect(needsIosInstallHint(IPAD_OS, 5, false)).toBe(true);
  });

  it("does not show on a real Mac, on Android, or once installed", () => {
    expect(needsIosInstallHint(IPAD_OS, 0, false)).toBe(false);
    expect(needsIosInstallHint(ANDROID, 5, false)).toBe(false);
    expect(needsIosInstallHint(IPHONE, 5, true)).toBe(false);
  });
});
