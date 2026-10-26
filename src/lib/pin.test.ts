import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hashPin, isValidPin, verifyPin } from "./pin";

describe("isValidPin", () => {
  it("accepts exactly 4 digits", () => {
    expect(isValidPin("0429")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("12345")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
  });
});

describe("hashPin", () => {
  it("is SHA-256 of the salt bytes then the PIN", async () => {
    const salt = "00112233445566778899aabbccddeeff";
    const expected = createHash("sha256")
      .update(Buffer.concat([Buffer.from(salt, "hex"), Buffer.from("1234", "utf8")]))
      .digest("hex");
    expect(await hashPin("1234", salt)).toEqual({ salt, hash: expected });
  });

  it("uses a new 16-byte salt each time, so the same PIN hashes differently", async () => {
    const first = await hashPin("1234");
    const second = await hashPin("1234");
    expect(first.salt).toMatch(/^[0-9a-f]{32}$/);
    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
  });

  it("never contains the PIN", async () => {
    const stored = await hashPin("5678");
    expect(JSON.stringify(stored)).not.toContain("5678");
  });

  it("rejects a PIN that is not 4 digits", async () => {
    await expect(hashPin("12")).rejects.toThrow("A PIN is exactly 4 digits.");
  });
});

describe("verifyPin", () => {
  it("accepts the right PIN and rejects others", async () => {
    const stored = await hashPin("2468");
    expect(await verifyPin("2468", stored)).toBe(true);
    expect(await verifyPin("2469", stored)).toBe(false);
    expect(await verifyPin("abc", stored)).toBe(false);
  });
});
