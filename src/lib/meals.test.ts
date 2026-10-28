import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MEALS, type CostTier } from "@/content/meals";
import type { CycleState, Phase } from "./cycle";
import { shiftDate } from "./cycle";
import { getAlternatives, getDailyMeal, type CuisinePreference, type MealInput } from "./meals";

function stateIn(phase: Phase | null): CycleState {
  return {
    mode: phase ? "standard" : "hormonal",
    cycleDay: 8,
    cycleStart: "2026-10-01",
    phase,
    isLateLuteal: false,
    nextPeriod: null,
    ovulationDay: phase ? 14 : null,
    fertileWindow: null,
    confidence: "medium",
    cycleLengthIsEstimate: false,
    avgCycleLength: 28,
    menstrualEnd: 5,
    periodLoggedDays: 5,
    status: "ok",
  };
}

// The phase on each cycle day of a 28-day cycle.
function phaseOnDay(day: number): Phase {
  const cycleDay = (day % 28) + 1;
  if (cycleDay <= 5) return "menstrual";
  if (cycleDay <= 12) return "follicular";
  if (cycleDay <= 15) return "ovulatory";
  return "luteal";
}

interface Run {
  days: number;
  phase?: (day: number) => Phase | null;
  maxCostTier?: CostTier;
  cuisinePreference?: CuisinePreference;
  excludedIds?: string[];
}

// Opens the app once a day: today's meal joins the history, and the last 21 feed the next day.
function simulate({ days, phase = phaseOnDay, maxCostTier = 2, cuisinePreference = "mixed", excludedIds = [] }: Run) {
  const picks: string[] = [];
  for (let day = 0; day < days; day++) {
    const input: MealInput = {
      cycleState: stateIn(phase(day)),
      today: shiftDate("2026-11-01", day),
      recentMealIds: picks.slice(-21).reverse(),
      maxCostTier,
      excludedIds,
      cuisinePreference,
    };
    picks.push(getDailyMeal(input).meal.id);
  }
  return picks.map((id) => MEALS.find((meal) => meal.id === id)!);
}

const base: MealInput = {
  cycleState: stateIn("follicular"),
  today: "2026-10-27",
  recentMealIds: [],
  maxCostTier: 2,
  excludedIds: [],
};

describe("the meal dataset", () => {
  it("has 70 meals: 22 Filipino and 48 everyday, with unique ids", () => {
    expect(MEALS).toHaveLength(70);
    expect(MEALS.filter((meal) => meal.cuisine === "filipino")).toHaveLength(22);
    expect(MEALS.filter((meal) => meal.cuisine === "simple")).toHaveLength(48);
    expect(new Set(MEALS.map((meal) => meal.id)).size).toBe(70);
  });

  it("no longer has the dishes she passed on, or the Filipino vegetable sides", () => {
    const removed = [
      "ginisang-munggo",
      "tinolang-isda",
      "pinakbet",
      "ginataang-manok",
      "laing",
      "adobong-kangkong",
      "utan-bisaya",
      "chopsuey",
      "ginataang-gulay",
      "talbos-ng-kamote-salad",
      "ensaladang-talong",
      "ginisang-upo",
      "togue-guisado",
      "ginisang-repolyo",
      "ginisang-kalabasa-sitaw",
    ];
    for (const id of removed) expect(MEALS.map((meal) => meal.id)).not.toContain(id);
  });

  it("leans protein-forward: most meals carry protein", () => {
    expect(MEALS.filter((meal) => meal.nutrientTags.includes("protein")).length).toBeGreaterThan(MEALS.length * 0.7);
  });

  it("gives every meal a phase, 3 to 6 steps, ingredients and a tag", () => {
    for (const meal of MEALS) {
      expect(meal.phases.length, meal.id).toBeGreaterThan(0);
      expect(meal.steps.length, meal.id).toBeGreaterThanOrEqual(3);
      expect(meal.steps.length, meal.id).toBeLessThanOrEqual(6);
      expect(meal.ingredients.length, meal.id).toBeGreaterThan(0);
      expect(meal.nutrientTags.length, meal.id).toBeGreaterThan(0);
    }
  });

  it("rounds prices to 5 pesos and keeps tiers in their price bands", () => {
    for (const meal of MEALS) {
      expect(meal.estPesoPerServing % 5, meal.id).toBe(0);
      const tier = meal.estPesoPerServing <= 40 ? 1 : meal.estPesoPerServing <= 80 ? 2 : 3;
      expect(meal.costTier, meal.id).toBe(tier);
    }
  });

  it("stays affordable: most meals fit the Normal budget or less", () => {
    expect(MEALS.filter((meal) => meal.costTier <= 2).length).toBeGreaterThan(MEALS.length * 0.8);
  });
});

describe("getDailyMeal", () => {
  it("returns the same meal for the same date, every time", () => {
    const first = getDailyMeal(base).meal.id;
    for (let call = 0; call < 5; call++) expect(getDailyMeal({ ...base }).meal.id).toBe(first);
    expect(getDailyMeal({ ...base, today: "2026-10-28" }).meal.id).not.toBe(first);
  });

  it("never repeats a meal within 21 days over 60 days", () => {
    const picks = simulate({ days: 60 });
    picks.forEach((meal, day) => {
      const window = picks.slice(Math.max(0, day - 20), day);
      expect(window.map((other) => other.id), `day ${day}`).not.toContain(meal.id);
    });
  });

  it("gives 7 different meals on 7 days that fit each day's phase, in both styles", () => {
    const picks = simulate({ days: 7 });
    expect(new Set(picks.map((meal) => meal.id)).size).toBe(7);
    picks.forEach((meal, day) => {
      expect(meal.phases.includes("all") || meal.phases.includes(phaseOnDay(day)), meal.id).toBe(true);
    });
    expect(new Set(picks.map((meal) => meal.cuisine)).size).toBe(2);
  });

  it("in the menstrual phase picks only meals for it, at least 60% of them iron-rich over 30 days", () => {
    const picks = simulate({ days: 30, phase: () => "menstrual" });
    for (const meal of picks) expect(meal.phases.includes("all") || meal.phases.includes("menstrual"), meal.id).toBe(true);
    const iron = picks.filter((meal) => meal.nutrientTags.includes("iron")).length;
    expect(iron / picks.length).toBeGreaterThanOrEqual(0.6);
  });

  it("mixes both styles, leaning everyday: Filipino about one day in three over 14 days", () => {
    const picks = simulate({ days: 14 });
    const filipino = picks.filter((meal) => meal.cuisine === "filipino").length;
    expect(filipino).toBeGreaterThanOrEqual(4);
    expect(picks.length - filipino).toBeGreaterThanOrEqual(8);
    // Never two Filipino dishes in a row.
    picks.slice(1).forEach((meal, day) => {
      if (meal.cuisine === "filipino") expect(picks[day].cuisine, `day ${day + 1}`).toBe("simple");
    });
  });

  it("keeps to the chosen style while it has options", () => {
    for (const meal of simulate({ days: 60, cuisinePreference: "simple" })) expect(meal.cuisine, meal.id).toBe("simple");
    for (const meal of simulate({ days: 60, cuisinePreference: "filipino" })) expect(meal.cuisine, meal.id).toBe("filipino");
  });

  it("keeps to the budget while it has options", () => {
    for (const meal of simulate({ days: 60, maxCostTier: 1 })) expect(meal.costTier, meal.id).toBe(1);
    for (const meal of simulate({ days: 60, maxCostTier: 2 })) expect(meal.costTier, meal.id).toBeLessThanOrEqual(2);
  });

  it("never returns nothing, even with every meal excluded and eaten recently", () => {
    const everything = MEALS.map((meal) => meal.id);
    const result = getDailyMeal({ ...base, excludedIds: everything, recentMealIds: everything, maxCostTier: 1 });
    expect(result.meal).toBeDefined();
    expect(getDailyMeal({ ...base, meals: [MEALS[0]], excludedIds: [MEALS[0].id] }).meal.id).toBe(MEALS[0].id);
  });

  it("uses every phase's meals when phases are hidden", () => {
    const picks = simulate({ days: 30, phase: () => null });
    expect(picks).toHaveLength(30);
    // 21 days without a repeat, from every phase's meals.
    expect(new Set(picks.slice(0, 21).map((meal) => meal.id)).size).toBe(21);
    expect(new Set(picks.flatMap((meal) => meal.phases)).size).toBeGreaterThan(2);
  });

  it("names the nutrient the phase leans on", () => {
    const menstrual = { ...base, cycleState: stateIn("menstrual") };
    const { meal, highlight } = getDailyMeal(menstrual);
    expect(meal.nutrientTags).toContain("iron");
    expect(highlight).toBe("iron");
  });
});

describe("getAlternatives", () => {
  it("offers different meals from today's, the other style first", () => {
    const today = getDailyMeal(base).meal;
    const alternatives = getAlternatives(base);
    expect(alternatives).toHaveLength(2);
    for (const { meal } of alternatives) expect(meal.id).not.toBe(today.id);
    expect(alternatives[0].meal.cuisine).not.toBe(today.cuisine);
  });

  it("is the same for the same date", () => {
    expect(getAlternatives(base).map(({ meal }) => meal.id)).toEqual(getAlternatives({ ...base }).map(({ meal }) => meal.id));
  });
});

describe("meal copy", () => {
  const BANNED = [
    "calorie",
    "kcal",
    "macro",
    "carbs to avoid",
    "lose weight",
    "slim",
    "guilt",
    "cheat",
    "clean eating",
    "detox",
    "burn",
    "fat-burning",
    "portion control",
    "diet",
  ];
  // "macro" also matches the dish name "macaroni", which is not diet language.
  const strip = (text: string) => text.toLowerCase().replaceAll("macaroni", "");
  const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
  const uiFiles = [
    ...readdirSync(join(process.cwd(), "src/components/meals")).map((file) => `src/components/meals/${file}`),
    "src/components/me/MealSuggestionsRow.tsx",
    "src/components/me/MealPreferencesSheet.tsx",
    "src/lib/meals.ts",
  ];

  for (const path of ["src/content/meals.ts", ...uiFiles]) {
    it(`has no diet or weight language in ${path}`, () => {
      const text = strip(read(path));
      for (const word of BANNED) expect(text, word).not.toContain(word);
    });
  }

  it("keeps every note under 15 words", () => {
    for (const meal of MEALS) {
      if (meal.note) expect(meal.note.split(/\s+/).length, meal.id).toBeLessThan(15);
    }
  });
});
