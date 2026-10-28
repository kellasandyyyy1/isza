import { MEALS, type CostTier, type Cuisine, type Meal, type NutrientTag } from "@/content/meals";
import type { CycleState, Phase } from "./cycle";
import { hashString } from "./hash";

export type CuisinePreference = "mixed" | "filipino" | "simple";

export interface MealInput {
  cycleState: CycleState;
  // "yyyy-MM-dd"
  today: string;
  // Meals from the last 21 days, newest first, one per day.
  recentMealIds: string[];
  maxCostTier: CostTier;
  excludedIds: string[];
  cuisinePreference?: CuisinePreference;
  // The meal list to pick from. Tests pass their own; the app uses MEALS.
  meals?: Meal[];
}

export interface MealSuggestion {
  meal: Meal;
  // The nutrient to name on the card: the one this phase leans on, else the meal's first.
  highlight: NutrientTag | null;
}

// What each phase leans on, from the phase food guidance. Meals carrying one are picked first.
export const PHASE_NUTRIENTS: Record<Phase, NutrientTag[]> = {
  menstrual: ["iron"],
  follicular: ["protein", "complex-carbs"],
  ovulatory: ["protein", "hydrating"],
  luteal: ["magnesium", "fiber"],
};

// When the pool runs dry, the recent list shrinks to the last 14 days.
const RELAXED_RECENT_DAYS = 14;

// The same date always gives the same number, so a reload shows the same meal.
const hashDate = (date: string) => hashString(date);

const suitsPhase = (meal: Meal, phase: Phase | null) =>
  phase === null || meal.phases.includes("all") || meal.phases.includes(phase);

// "mixed" leans everyday: a Filipino dish about one day in three, never two days running.
const FILIPINO_EVERY = 3;

function todaysCuisine(input: MealInput, meals: Meal[]): Cuisine | null {
  const preference = input.cuisinePreference ?? "mixed";
  if (preference !== "mixed") return preference;
  const recent = input.recentMealIds
    .slice(0, FILIPINO_EVERY - 1)
    .map((id) => meals.find((meal) => meal.id === id)?.cuisine);
  // A full run of everyday meals since the last Filipino one: Filipino today.
  if (recent.length === FILIPINO_EVERY - 1) return recent.includes("filipino") ? "simple" : "filipino";
  // Too little history to tell: the date decides, still about one day in three.
  if (recent.includes("filipino")) return "simple";
  return hashDate(input.today) % FILIPINO_EVERY === 0 ? "filipino" : "simple";
}

interface Rules {
  phaseNutrient: boolean;
  alternation: boolean;
  recentDays: number;
  phase: boolean;
  cost: boolean;
}

// Strictest first. Each step drops one rule, in the order the spec relaxes them: the phase's nutrient,
// then the day-to-day style rhythm, then repeats older than 14 days, then the phase, then the budget.
const RELAXATION: Rules[] = [
  { phaseNutrient: true, alternation: true, recentDays: 21, phase: true, cost: true },
  { phaseNutrient: false, alternation: true, recentDays: 21, phase: true, cost: true },
  { phaseNutrient: false, alternation: false, recentDays: 21, phase: true, cost: true },
  { phaseNutrient: false, alternation: false, recentDays: RELAXED_RECENT_DAYS, phase: true, cost: true },
  { phaseNutrient: false, alternation: false, recentDays: RELAXED_RECENT_DAYS, phase: false, cost: true },
  { phaseNutrient: false, alternation: false, recentDays: RELAXED_RECENT_DAYS, phase: false, cost: false },
];

function poolFor(input: MealInput, rules: Rules): Meal[] {
  const meals = input.meals ?? MEALS;
  const phase = input.cycleState.phase;
  const preference = input.cuisinePreference ?? "mixed";
  const cuisine = todaysCuisine(input, meals);
  const recent = new Set(input.recentMealIds.slice(0, rules.recentDays));
  const excluded = new Set(input.excludedIds);
  const nutrients = phase ? PHASE_NUTRIENTS[phase] : [];
  return meals.filter(
    (meal) =>
      (!rules.phase || suitsPhase(meal, phase)) &&
      (!rules.phaseNutrient || nutrients.length === 0 || meal.nutrientTags.some((tag) => nutrients.includes(tag))) &&
      // A chosen style always holds; "mixed" only keeps its rhythm while it can.
      (preference !== "mixed" ? meal.cuisine === preference : !rules.alternation || meal.cuisine === cuisine) &&
      !recent.has(meal.id) &&
      !excluded.has(meal.id) &&
      (!rules.cost || meal.costTier <= input.maxCostTier),
  );
}

// The first non-empty pool, strictest rules first. As a last resort every meal, so there is always a pick.
function bestPool(input: MealInput): Meal[] {
  for (const rules of RELAXATION) {
    const pool = poolFor(input, rules);
    if (pool.length > 0) return pool;
  }
  return input.meals ?? MEALS;
}

function highlightFor(meal: Meal, phase: Phase | null): NutrientTag | null {
  const preferred = phase ? PHASE_NUTRIENTS[phase] : [];
  return meal.nutrientTags.find((tag) => preferred.includes(tag)) ?? meal.nutrientTags[0] ?? null;
}

// One meal for the day, the same one every time for the same input. Never null.
export function getDailyMeal(input: MealInput): MealSuggestion {
  const pool = bestPool(input);
  const meal = pool[hashDate(input.today) % pool.length];
  return { meal, highlight: highlightFor(meal, input.cycleState.phase) };
}

// The next picks after today's meal, from the same rules but either style, the other style first.
export function getAlternatives(input: MealInput, count = 2): MealSuggestion[] {
  const current = getDailyMeal(input).meal;
  const wider = { ...input, cuisinePreference: input.cuisinePreference ?? "mixed" };
  let pool: Meal[] = [];
  for (const rules of RELAXATION.slice(2)) {
    pool = poolFor(wider, rules).filter((meal) => meal.id !== current.id);
    if (pool.length >= count) break;
  }
  const start = hashDate(input.today) % Math.max(pool.length, 1);
  const rotated = [...pool.slice(start), ...pool.slice(0, start)];
  const ordered = [
    ...rotated.filter((meal) => meal.cuisine !== current.cuisine),
    ...rotated.filter((meal) => meal.cuisine === current.cuisine),
  ];
  return ordered.slice(0, count).map((meal) => ({ meal, highlight: highlightFor(meal, input.cycleState.phase) }));
}

export const NUTRIENT_LABELS: Record<NutrientTag, string> = {
  iron: "Iron-rich",
  protein: "Protein-rich",
  magnesium: "Magnesium-rich",
  fiber: "Fiber-rich",
  calcium: "Calcium-rich",
  hydrating: "Hydrating",
  "complex-carbs": "Slow-release carbs",
};

// "about P45 per serving (estimate)". Prices are rough guides, so the label always says so.
export function formatMealPrice(pesos: number): string {
  return `about ₱${pesos} per serving (estimate)`;
}

export const BUDGET_TIERS: Record<"tight" | "normal" | "flexible", CostTier> = { tight: 1, normal: 2, flexible: 3 };
