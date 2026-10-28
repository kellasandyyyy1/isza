import { describe, expect, it } from "vitest";
import type { CycleState } from "./cycle";
import { MAX_LATE_DOTS, RING_VIEW, ringLayout } from "./cycleRing";

function state(fields: Partial<CycleState> = {}): CycleState {
  return {
    mode: "standard",
    cycleDay: 8,
    cycleStart: "2026-10-18",
    phase: "follicular",
    isLateLuteal: false,
    nextPeriod: null,
    ovulationDay: 14,
    fertileWindow: null,
    confidence: "high",
    cycleLengthIsEstimate: false,
    avgCycleLength: 28,
    menstrualEnd: 5,
    periodLoggedDays: 5,
    status: "ok",
    ...fields,
  };
}

const CENTER = RING_VIEW / 2;
const distance = (dot: { x: number; y: number }) => Math.hypot(dot.x - CENTER, dot.y - CENTER);

describe("ringLayout positions", () => {
  for (const dayCount of [21, 28, 35, 45]) {
    it(`places ${dayCount} dots evenly, day 1 at the top, clockwise`, () => {
      const layout = ringLayout(state({ avgCycleLength: dayCount, cycleDay: 3, ovulationDay: dayCount - 14 }));
      expect(layout.dots).toHaveLength(dayCount);
      const [first, second] = layout.dots;
      // Day 1 at 12 o'clock.
      expect(first.x).toBeCloseTo(CENTER);
      expect(first.y).toBeCloseTo(CENTER - layout.ringRadius);
      // Clockwise: day 2 is to the right of day 1.
      expect(second.x).toBeGreaterThan(first.x);
      // Every neighbour pair is the same distance apart, all the way round.
      const gaps = layout.dots.map((dot, index) => {
        const next = layout.dots[(index + 1) % dayCount];
        return Math.hypot(next.x - dot.x, next.y - dot.y);
      });
      for (const gap of gaps) expect(gap).toBeCloseTo(gaps[0]);
      // Neighbouring dots never touch.
      expect(gaps[0]).toBeGreaterThan(2 * layout.dots[1].r);
    });

    it(`keeps the centre clear at ${dayCount} days`, () => {
      const layout = ringLayout(state({ avgCycleLength: dayCount, ovulationDay: dayCount - 14 }));
      expect(layout.ringRadius).toBe(RING_VIEW / 2 - 14);
      expect(layout.clearRadius).toBe(layout.ringRadius - 16);
      for (const dot of layout.dots) expect(distance(dot) - dot.r).toBeGreaterThanOrEqual(layout.clearRadius);
    });
  }

  it("puts today at index cycleDay - 1", () => {
    const layout = ringLayout(state({ cycleDay: 8 }));
    expect(layout.dots.findIndex((dot) => dot.isToday)).toBe(7);
    expect(layout.dots.filter((dot) => dot.isToday)).toHaveLength(1);
  });

  it("sizes dots from their spacing, between 2.5 and 5", () => {
    const radii = [21, 28, 45].map((dayCount) => ringLayout(state({ avgCycleLength: dayCount })).dots[0].r);
    for (const r of radii) {
      expect(r).toBeGreaterThanOrEqual(2.5);
      expect(r).toBeLessThanOrEqual(5);
    }
    expect(radii[2]).toBeLessThan(radii[0]);
  });
});

describe("ringLayout colors", () => {
  it("colors logged and predicted period days, the fertile window and the other phases", () => {
    // Day 3 of an open period: days 1 to 3 logged, 4 and 5 predicted.
    const dots = ringLayout(state({ cycleDay: 3, periodLoggedDays: 3, phase: "menstrual" })).dots;
    expect(dots[0]).toMatchObject({ fill: "var(--period)", opacity: 1 });
    // Day 4: predicted period, and in the future.
    expect(dots[3]).toMatchObject({ fill: "var(--period)" });
    expect(dots[3].opacity).toBeCloseTo(0.35 * 0.6);
    // Days 9 to 15 are the fertile window around ovulation on day 14.
    expect(dots[8].fill).toBe("var(--phase-ovulatory)");
    expect(dots[14].fill).toBe("var(--phase-ovulatory)");
    expect(dots[15].fill).toBe("var(--phase-luteal)");
    expect(dots[6].fill).toBe("var(--phase-follicular)");
  });

  it("fades future days to 60% so the ring reads as progress", () => {
    const dots = ringLayout(state({ cycleDay: 20 })).dots;
    // Day 18 is past, day 22 is ahead: both luteal at 35%.
    expect(dots[17].opacity).toBeCloseTo(0.35);
    expect(dots[21].opacity).toBeCloseTo(0.21);
  });

  it("lets today win over period, fertile and phase colors", () => {
    for (const cycleDay of [2, 12, 22]) {
      const today = ringLayout(state({ cycleDay, periodLoggedDays: 5 })).dots[cycleDay - 1];
      expect(today).toMatchObject({ isToday: true, fill: "var(--ink)", opacity: 1 });
      expect(today.r).toBeCloseTo(ringLayout(state()).dots[0].r + 2.5);
    }
  });

  it("is the only full-contrast ink dot", () => {
    const dots = ringLayout(state({ cycleDay: 8 })).dots;
    expect(dots.filter((dot) => dot.fill === "var(--ink)")).toHaveLength(1);
  });

  for (const mode of ["hormonal", "irregular"] as const) {
    it(`has no phase, period or fertile colors in ${mode} mode`, () => {
      const dots = ringLayout(state({ mode, phase: null, ovulationDay: null, cycleDay: 10 })).dots;
      const others = dots.filter((dot) => !dot.isToday);
      expect(new Set(others.map((dot) => dot.fill))).toEqual(new Set(["var(--surface-2)"]));
      expect(dots[9]).toMatchObject({ isToday: true, fill: "var(--ink)" });
    });
  }
});

describe("ringLayout late cycles", () => {
  it("continues past the expected length in muted dots, with today last", () => {
    const layout = ringLayout(state({ status: "late", phase: "luteal", cycleDay: 33 }));
    expect(layout.extraDots).toBe(5);
    expect(layout.dots).toHaveLength(33);
    expect(layout.dots[28]).toMatchObject({ fill: "var(--ink-muted)", opacity: 0.5 });
    expect(layout.dots[32].isToday).toBe(true);
  });

  it("caps the extra dots at 14", () => {
    const layout = ringLayout(state({ status: "late", phase: "luteal", cycleDay: 82 }));
    expect(layout.extraDots).toBe(MAX_LATE_DOTS);
    expect(layout.dots).toHaveLength(28 + 14);
    expect(layout.dots.at(-1)?.isToday).toBe(true);
    for (const dot of layout.dots) expect(distance(dot) - dot.r).toBeGreaterThanOrEqual(layout.clearRadius);
  });
});
