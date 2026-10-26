// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Never send real pushes or touch a real database in tests.
const sendNotification = vi.fn();
vi.mock("web-push", () => ({ setVapidDetails: vi.fn(), sendNotification, WebPushError: class extends Error {} }));
const sendDueReminders = vi.fn(async () => ({ sent: 0, failed: 0, removed: 0 }));
vi.mock("@/server/push-send", () => ({ sendDueReminders }));

const { POST } = await import("./route");

// A made-up test value, 40 characters.
const SECRET = "test-secret-0123456789abcdef0123456789ab";

const request = (authorization?: string) =>
  new Request("http://localhost/api/push/send", {
    method: "POST",
    headers: authorization ? { authorization } : {},
    body: "{}",
  });

describe("POST /api/push/send", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", SECRET);
    vi.clearAllMocks();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("returns 401 without the exact secret and sends nothing", async () => {
    for (const authorization of [
      undefined,
      "Bearer wrong-secret",
      SECRET,
      `bearer ${SECRET}`,
      // (A trailing space is not tested: HTTP header values are trimmed before the route sees them.)
      `Bearer  ${SECRET}`,
      `Bearer ${SECRET.slice(0, -1)}`,
      `Bearer ${SECRET}x`,
      "Bearer ",
    ]) {
      const response = await POST(request(authorization));
      expect(response.status, String(authorization)).toBe(401);
    }
    expect(sendDueReminders).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("returns 500 and sends nothing when CRON_SECRET is missing or shorter than 32 characters", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await POST(request("Bearer "))).status).toBe(500);
    vi.stubEnv("CRON_SECRET", "a".repeat(31));
    expect((await POST(request(`Bearer ${"a".repeat(31)}`))).status).toBe(500);
    expect(sendDueReminders).not.toHaveBeenCalled();
  });

  it("returns counts only with the right secret", async () => {
    const response = await POST(request(`Bearer ${SECRET}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ sent: 0, failed: 0, removed: 0 });
  });
});
