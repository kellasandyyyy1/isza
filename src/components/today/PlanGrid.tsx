import { WaterCard } from "@/components/water/WaterCard";
import { guidance, type GuidanceKey } from "@/content/guidance";
import { getGuidance } from "@/lib/guidance";
import { PlanCard } from "./PlanCard";
import type { WaterCardData } from "./PlanCarousel";
import { PLAN_TOPICS, type PlanTopic } from "./todayConfig";

interface PlanGridProps {
  guidanceKey: GuidanceKey;
  onOpen: (topic: PlanTopic) => void;
  // Today's rotating line for each plan card, under its phase sentence.
  notes?: Partial<Record<PlanTopic, string>>;
  // The Water card after Food, while she tracks water.
  water?: WaterCardData | null;
}

// Desktop: the plan cards in two columns, in the same order as the mobile carousel.
export function PlanGrid({ guidanceKey, onOpen, water = null, notes = {} }: PlanGridProps) {
  return (
    <section aria-label="Today's plan" className="hidden grid-cols-2 gap-4 lg:grid">
      {PLAN_TOPICS.flatMap(({ key, title, icon, tone, art }) => {
        const card = (
          <PlanCard
            key={key}
            title={title}
            icon={icon}
            tone={tone}
            art={art}
            text={getGuidance(guidanceKey, key)}
            neutralText={guidance.neutral[key]}
            note={notes[key]}
            onOpen={() => onOpen(key)}
          />
        );
        return key === "food" && water ? [card, <WaterCard key="water" {...water} />] : [card];
      })}
    </section>
  );
}
