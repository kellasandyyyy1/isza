import { describe, expect, it } from "vitest";
import { isDue, isExpiredOnce, localParts, type ScheduledReminder } from "./pushSchedule";

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const recurring = (timeLocal: string, fields: Partial<ScheduledReminder> = {}): ScheduledReminder => ({
  kind: "recurring",
  timeLocal,
  days: EVERY_DAY,
  sendAt: null,
  lastSentAt: null,
  ...fields,
});
const at = (iso: string) => new Date(iso);

describe("localParts", () => {
  it("gives the local date, weekday and minutes in each time zone", () => {
    // Monday, Oct 26, 2026 at 12:00 UTC.
    const now = at("2026-10-26T12:00:00Z");
    expect(localParts(now, "Asia/Manila")).toEqual({ date: "2026-10-26", weekday: 1, minutes: 20 * 60 });
    expect(localParts(now, "America/New_York")).toEqual({ date: "2026-10-26", weekday: 1, minutes: 8 * 60 });
    expect(localParts(now, "Europe/London")).toEqual({ date: "2026-10-26", weekday: 1, minutes: 12 * 60 });
  });

  it("uses 00 for midnight, not 24", () => {
    expect(localParts(at("2026-10-26T16:00:00Z"), "Asia/Manila")).toMatchObject({ date: "2026-10-27", minutes: 0 });
  });
});

describe("recurring reminders", () => {
  it("are due at the same local time in every time zone", () => {
    const reminder = recurring("08:00");
    // 08:00 local is 00:00 UTC in Manila (UTC+8), 12:00 UTC in New York (UTC-4), 08:00 UTC in London (UTC+0).
    expect(isDue(reminder, "Asia/Manila", at("2026-10-26T00:02:00Z"))).toBe(true);
    expect(isDue(reminder, "America/New_York", at("2026-10-26T12:02:00Z"))).toBe(true);
    expect(isDue(reminder, "Europe/London", at("2026-10-26T08:02:00Z"))).toBe(true);
    expect(isDue(reminder, "Asia/Manila", at("2026-10-26T08:02:00Z"))).toBe(false);
  });

  it("follow summer time: London is UTC+1 in October before the clocks change", () => {
    expect(isDue(recurring("08:00"), "Europe/London", at("2026-10-20T07:01:00Z"))).toBe(true);
    expect(isDue(recurring("08:00"), "Europe/London", at("2026-10-20T08:01:00Z"))).toBe(false);
  });

  it("are due only in the window (now minus 5 minutes, now]", () => {
    const reminder = recurring("20:30");
    expect(isDue(reminder, "Asia/Manila", at("2026-10-26T12:30:00Z"))).toBe(true);
    expect(isDue(reminder, "Asia/Manila", at("2026-10-26T12:34:59Z"))).toBe(true);
    expect(isDue(reminder, "Asia/Manila", at("2026-10-26T12:35:00Z"))).toBe(false);
    expect(isDue(reminder, "Asia/Manila", at("2026-10-26T12:29:59Z"))).toBe(false);
  });

  it("only fire on chosen weekdays, in local time", () => {
    // 07:00 Monday in Manila is still Sunday 19:00 in New York.
    const mondays = recurring("07:00", { days: [1] });
    expect(isDue(mondays, "Asia/Manila", at("2026-10-25T23:01:00Z"))).toBe(true);
    const sundays = recurring("19:00", { days: [0] });
    expect(isDue(sundays, "America/New_York", at("2026-10-25T23:01:00Z"))).toBe(true);
    expect(isDue(recurring("19:00", { days: [1] }), "America/New_York", at("2026-10-25T23:01:00Z"))).toBe(false);
  });

  it("handle a window that crosses local midnight", () => {
    // 23:58 Sunday in London; the check runs at 00:01 Monday.
    const sundayLate = recurring("23:58", { days: [0] });
    expect(isDue(sundayLate, "Europe/London", at("2026-11-02T00:01:00Z"))).toBe(true);
  });

  it("are not sent twice on the same local day", () => {
    const sent = recurring("08:00", { lastSentAt: "2026-10-26T00:00:30Z" });
    expect(isDue(sent, "Asia/Manila", at("2026-10-26T00:04:00Z"))).toBe(false);
    // Sent yesterday local time: due again today.
    const sentYesterday = recurring("08:00", { lastSentAt: "2026-10-25T00:00:30Z" });
    expect(isDue(sentYesterday, "Asia/Manila", at("2026-10-26T00:02:00Z"))).toBe(true);
  });
});

describe("once reminders", () => {
  const once = (sendAt: string, lastSentAt: string | null = null): ScheduledReminder => ({
    kind: "once",
    timeLocal: null,
    days: null,
    sendAt,
    lastSentAt,
  });

  it("are due once send_at has passed and never again", () => {
    expect(isDue(once("2026-11-11T00:00:00Z"), "Asia/Manila", at("2026-11-11T00:00:00Z"))).toBe(true);
    expect(isDue(once("2026-11-11T00:00:00Z"), "Asia/Manila", at("2026-11-10T23:59:00Z"))).toBe(false);
    expect(isDue(once("2026-11-11T00:00:00Z", "2026-11-11T00:01:00Z"), "Asia/Manila", at("2026-11-12T00:00:00Z"))).toBe(
      false,
    );
  });

  it("expire a week after they were sent", () => {
    const sent = once("2026-11-11T00:00:00Z", "2026-11-11T00:01:00Z");
    expect(isExpiredOnce(sent, at("2026-11-18T00:00:00Z"))).toBe(false);
    expect(isExpiredOnce(sent, at("2026-11-18T00:02:00Z"))).toBe(true);
    expect(isExpiredOnce(once("2026-11-11T00:00:00Z"), at("2027-01-01T00:00:00Z"))).toBe(false);
    expect(isExpiredOnce(recurring("08:00", { lastSentAt: "2026-01-01T00:00:00Z" }), at("2027-01-01T00:00:00Z"))).toBe(
      false,
    );
  });
});
