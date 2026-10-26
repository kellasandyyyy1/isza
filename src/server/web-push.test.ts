// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

// Never send real pushes in tests.
const setVapidDetails = vi.fn();
vi.mock("web-push", () => ({ setVapidDetails, sendNotification: vi.fn(), WebPushError: class extends Error {} }));

// Made-up values, not real keys. The real web-push is mocked, so only the checks here run.
const VALID = {
  VAPID_SUBJECT: "mailto:test@example.com",
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: "test-public-key",
  VAPID_PRIVATE_KEY: "test-private-key",
};

async function loadWith(env: Partial<typeof VALID>) {
  vi.resetModules();
  for (const [name, value] of Object.entries({ ...VALID, ...env })) vi.stubEnv(name, value);
  return import("./web-push");
}

describe("VAPID setup at module load", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    setVapidDetails.mockClear();
  });

  it("sets the VAPID details once when the module loads", async () => {
    await loadWith({});
    expect(setVapidDetails).toHaveBeenCalledTimes(1);
    expect(setVapidDetails).toHaveBeenCalledWith("mailto:test@example.com", "test-public-key", "test-private-key");
  });

  it("accepts an https:// subject", async () => {
    await loadWith({ VAPID_SUBJECT: "https://isza.example" });
    expect(setVapidDetails).toHaveBeenCalledTimes(1);
  });

  it("fails with a clear error when a value is missing", async () => {
    await expect(loadWith({ VAPID_PRIVATE_KEY: "" })).rejects.toThrow(
      "Missing environment variable VAPID_PRIVATE_KEY. See .env.example.",
    );
    await expect(loadWith({ NEXT_PUBLIC_VAPID_PUBLIC_KEY: "" })).rejects.toThrow("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
    await expect(loadWith({ VAPID_SUBJECT: "" })).rejects.toThrow("VAPID_SUBJECT");
  });

  it("rejects a subject that is not mailto: or https://", async () => {
    await expect(loadWith({ VAPID_SUBJECT: "test@example.com" })).rejects.toThrow(
      "VAPID_SUBJECT must start with mailto: or https://.",
    );
    await expect(loadWith({ VAPID_SUBJECT: "http://isza.example" })).rejects.toThrow("mailto: or https://");
    expect(setVapidDetails).not.toHaveBeenCalled();
  });

  it("skips the check while next build collects pages", async () => {
    await expect(loadWith({ VAPID_PRIVATE_KEY: "", NEXT_PHASE: "phase-production-build" } as Partial<typeof VALID>)).resolves.toBeDefined();
    expect(setVapidDetails).not.toHaveBeenCalled();
  });
});
