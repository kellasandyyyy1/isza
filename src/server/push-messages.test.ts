import { describe, expect, it } from "vitest";
import { PUSH_REMINDER_TYPES } from "@/lib/pushApi";
import { TEST_MESSAGE, pushMessage, pushUrl } from "./push-messages";

const FORBIDDEN = /period|cycle|ovulation|symptom|bleeding/i;

describe("push messages", () => {
  // The normal title is the app name, Iszacycle, which contains "cycle". Everything else, and the whole of a
  // discreet notification, never mentions periods, cycles, ovulation, symptoms or bleeding.
  it("never mention periods, cycles, ovulation, symptoms or bleeding, apart from the app name as the title", () => {
    for (const type of PUSH_REMINDER_TYPES) {
      const normal = pushMessage(type, false);
      expect(normal.title, type).toBe("Iszacycle");
      expect(normal.body, type).not.toMatch(FORBIDDEN);
      const discreet = pushMessage(type, true);
      expect(`${discreet.title} ${discreet.body}`, `${type} discreet`).not.toMatch(FORBIDDEN);
    }
    expect(TEST_MESSAGE.body).not.toMatch(FORBIDDEN);
  });

  it("use the fixed texts", () => {
    expect(pushMessage("check-in", false)).toEqual({ title: "Iszacycle", body: "Time for your daily check-in." });
    expect(pushMessage("pill", false)).toEqual({ title: "Iszacycle", body: "You have a reminder." });
    expect(pushMessage("planner", false)).toEqual({ title: "Iszacycle", body: "Take a look at your planner today." });
    for (const type of PUSH_REMINDER_TYPES) {
      expect(pushMessage(type, true)).toEqual({ title: "Reminder", body: "You have a new reminder." });
    }
  });

  it("open the check-in for check-in reminders and Today for the rest", () => {
    expect(pushUrl("check-in")).toBe("/today?checkin=1");
    expect(pushUrl("planner")).toBe("/today");
  });
});
