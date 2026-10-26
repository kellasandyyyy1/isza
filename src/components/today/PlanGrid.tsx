import { guidance, type GuidanceKey } from "@/content/guidance";
import { PlanCard } from "./PlanCard";
import { PLAN_TOPICS, type PlanTopic } from "./todayConfig";

// Desktop: the five plan cards in two columns.
export function PlanGrid({ guidanceKey, onOpen }: { guidanceKey: GuidanceKey; onOpen: (topic: PlanTopic) => void }) {
  return (
    <section aria-label="Today's plan" className="hidden grid-cols-2 gap-4 lg:grid">
      {PLAN_TOPICS.map(({ key, title, icon, tone, art }) => (
        <PlanCard key={key} title={title} icon={icon} tone={tone} art={art} text={guidance[guidanceKey][key]} onOpen={() => onOpen(key)} />
      ))}
    </section>
  );
}
