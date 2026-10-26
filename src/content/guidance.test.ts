import { describe, expect, it } from "vitest";
import { guidance } from "./guidance";

const lines = Object.entries(guidance).flatMap(([key, entry]) =>
  Object.entries(entry).map(([topic, text]) => ({ id: `${key}.${topic}`, text })),
);

describe("guidance", () => {
  it("has five phases worth of entries with five topics each", () => {
    expect(Object.keys(guidance)).toEqual(["menstrual", "follicular", "ovulatory", "luteal", "neutral"]);
    expect(lines).toHaveLength(25);
  });

  it("keeps every line at 20 words or fewer", () => {
    for (const { id, text } of lines) expect(text.split(/\s+/).length, id).toBeLessThanOrEqual(20);
  });
});
