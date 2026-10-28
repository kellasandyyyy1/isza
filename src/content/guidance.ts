import type { Phase } from "@/lib/cycle";
import type { ReadinessBand } from "@/lib/readiness";

export type GuidanceKey = Phase | "neutral";

export interface GuidanceEntry {
  train: string;
  food: string;
  energy: string;
  sleep: string;
  social: string;
}

// "neutral" is used for hormonal, irregular and no-data modes.
export const guidance: Record<GuidanceKey, GuidanceEntry> = {
  menstrual: {
    train: "Gentle movement often feels best. Try walking, yoga or light mobility.",
    food: "Add iron-rich foods like malunggay, monggo, kangkong, eggs or lean meat.",
    energy: "Energy may be lower. Keep your schedule light where you can.",
    sleep: "Your body may want extra rest. Aim for an earlier night.",
    social: "A good time for low-key plans and recharging.",
  },
  follicular: {
    train: "Energy is often rising. Good days for strength and learning new skills.",
    food: "Fuel training with protein and complex carbs like rice, oats and sweet potato.",
    energy: "Good days to start projects and tackle hard tasks.",
    sleep: "Sleep often feels easier now. Keep a steady bedtime.",
    social: "You may feel more social. Say yes to plans.",
  },
  ovulatory: {
    train: "Often your strongest days. Go for intense sessions with a full warm-up.",
    food: "Keep protein high and stay well hydrated around hard sessions.",
    energy: "Confidence is often high. Schedule big meetings and presentations.",
    sleep: "Wind down after intense days so recovery keeps up.",
    social: "Great days for events, dates and catching up.",
  },
  luteal: {
    train: "Steady, moderate training often fits best. Lower intensity late in the phase.",
    food: "Choose steady meals with protein, fiber and magnesium foods like nuts and greens.",
    energy: "Energy may dip later on. Leave buffer time in your calendar.",
    sleep: "Sleep may get lighter before your period. Start winding down earlier.",
    social: "Protect some quiet time, especially in the last few days.",
  },
  neutral: {
    train: "Match today's workout to how you feel and your readiness score.",
    food: "Build meals around protein, fiber and plenty of water.",
    energy: "Use your check-ins to spot your own energy patterns.",
    sleep: "A steady bedtime helps your energy and mood.",
    social: "Plan around how you feel today.",
  },
};

// One optional line beside the water tally in the check-in details. Never an instruction, never a fix for a symptom.
export const waterNote: Record<GuidanceKey, string | null> = {
  menstrual: "Warm drinks and water are often welcome on these days.",
  follicular: null,
  ovulatory: "Worth keeping water nearby around harder sessions.",
  luteal: "Some people find they want more water in this phase.",
  neutral: null,
};

// One sentence per readiness band. Shown under the readiness pill on Today and on the Train tab.
export const bandAdvice: Record<ReadinessBand, string> = {
  Go: "Good day to push. Try strength or intervals.",
  Steady: "Keep it moderate. Steady cardio or technique work.",
  Rest: "Recovery day. Mobility, a walk or full rest.",
};
