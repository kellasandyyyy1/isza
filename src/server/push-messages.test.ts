import { describe, expect, it } from "vitest";
import { PUSH_REMINDER_TYPES } from "@/lib/pushApi";
import { TEST_MESSAGE, pushMessage, pushUrl } from "./push-messages";

const FORBIDDEN = /period|cycle|ovulation|symptom|bleeding/i;

describe("push messages", () => {
  it("never mention periods, cycles, ovulation, symptoms or bleeding in any mode", () => {
    for (const type of PUSH_REMINDER_TYPES) {
      for (const discreet of [false, true]) {
        const { title, body } = pushMessage(type, discreet);
        expect(`${title} ${body}`, `${type} discreet=${discreet}`).not.toMatch(FORBIDDEN);
      }
    }
    expect(`${TEST_MESSAGE.title} ${TEST_MESSAGE.body}`).not.toMatch(FORBIDDEN);
  });

  it("use the fixed texts", () => {
    expect(pushMessage("check-in", false)).toEqual({ title: "Isza", body: "Time for your daily check-in." });
    expect(pushMessage("pill", false)).toEqual({ title: "Isza", body: "You have a reminder." });
    expect(pushMessage("planner", false)).toEqual({ title: "Isza", body: "Take a look at your planner today." });
    for (const type of PUSH_REMINDER_TYPES) {
      expect(pushMessage(type, true)).toEqual({ title: "Reminder", body: "You have a new reminder." });
    }
  });

  it("open the check-in for check-in reminders and Today for the rest", () => {
    expect(pushUrl("check-in")).toBe("/today?checkin=1");
    expect(pushUrl("planner")).toBe("/today");
  });
});
