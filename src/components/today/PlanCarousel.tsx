"use client";

import { useEffect, useRef, useState } from "react";
import { WaterCard } from "@/components/water/WaterCard";
import { guidance, type GuidanceKey } from "@/content/guidance";
import { getGuidance } from "@/lib/guidance";
import { cx } from "@/lib/cx";
import { PlanCard } from "./PlanCard";
import type { PlanCardRoom } from "./planCardLayout";
import { PLAN_TOPICS, type PlanTopic } from "./todayConfig";

// The water tally on Today, while she tracks water.
export interface WaterCardData {
  count: number;
  // Today's rotating water line, under the count.
  note?: string;
  onAdd: () => void;
  onOpen: () => void;
}

interface PlanCarouselProps {
  guidanceKey: GuidanceKey;
  onOpen: (topic: PlanTopic) => void;
  // Extra rows on Today (period pill, a chip, late notes) take room from the cards: "light" for one, "heavy" for
  // two or more. Any extra row hides the carousel under 700px tall.
  room?: PlanCardRoom;
  // Today's rotating line for each plan card, under its phase sentence.
  notes?: Partial<Record<PlanTopic, string>>;
  // The Water card, third after Food. Null while today's tally is loading, and the row closes the gap.
  water?: WaterCardData | null;
}

const CARD_WIDTH = "w-[88%] shrink-0 snap-start sm:w-[60%]";

// Mobile and tablet: a horizontal snap row with dots that follow the scroll position.
export function PlanCarousel({ guidanceKey, onOpen, room = "roomy", water = null, notes = {} }: PlanCarouselProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Train, Food, Water, Energy, Sleep, Social. Water once today's tally has loaded.
  const cards: (PlanTopic | "water")[] = PLAN_TOPICS.flatMap(({ key }) => (key === "food" && water ? [key, "water" as const] : [key]));

  // Always open on the first card (Train). The browser can restore an old scroll position otherwise.
  useEffect(() => {
    if (rowRef.current) rowRef.current.scrollLeft = 0;
  }, []);

  function handleScroll() {
    const row = rowRef.current;
    const [first, second] = row ? Array.from(row.children) : [];
    if (!row || !(first instanceof HTMLElement) || !(second instanceof HTMLElement)) return;
    const step = second.offsetLeft - first.offsetLeft;
    setActive(Math.min(cards.length - 1, Math.max(0, Math.round(row.scrollLeft / step))));
  }

  return (
    // Cards keep their own height; the hero above takes any spare space.
    // Each card is 88% wide, so about 12% of the next one peeks in.
    <section
      aria-label="Today's plan"
      className={cx("flex shrink-0 flex-col gap-2 lg:hidden", room !== "roomy" && "[@media(max-height:699px)]:hidden")}
    >
      <div
        ref={rowRef}
        onScroll={handleScroll}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overflow-y-hidden px-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6"
      >
        {cards.map((card) => {
          if (card === "water") {
            return water ? (
              <WaterCard key="water" {...water} compact room={room} className={CARD_WIDTH} />
            ) : null;
          }
          const topic = PLAN_TOPICS.find(({ key }) => key === card);
          if (!topic) return null;
          return (
            <PlanCard
              key={topic.key}
              title={topic.title}
              icon={topic.icon}
              tone={topic.tone}
              art={topic.art}
              text={getGuidance(guidanceKey, topic.key)}
              neutralText={guidance.neutral[topic.key]}
              note={notes[topic.key]}
              onOpen={() => onOpen(topic.key)}
              compact
              room={room}
              className={CARD_WIDTH}
            />
          );
        })}
      </div>
      <div aria-hidden className="flex shrink-0 justify-center gap-1.5">
        {cards.map((card, index) => (
          <span
            key={card}
            className={cx("h-1.5 rounded-pill transition-all", index === active ? "w-4 bg-ink" : "w-1.5 bg-ink-muted")}
          />
        ))}
      </div>
    </section>
  );
}
