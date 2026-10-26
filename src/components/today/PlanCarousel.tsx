"use client";

import { useEffect, useRef, useState } from "react";
import { guidance, type GuidanceKey } from "@/content/guidance";
import { cx } from "@/lib/cx";
import { PlanCard } from "./PlanCard";
import { PLAN_TOPICS, type PlanTopic } from "./todayConfig";

// Mobile and tablet: a horizontal snap row with dots that follow the scroll position.
export function PlanCarousel({ guidanceKey, onOpen }: { guidanceKey: GuidanceKey; onOpen: (topic: PlanTopic) => void }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Always open on the first card (Train). The browser can restore an old scroll position otherwise.
  useEffect(() => {
    if (rowRef.current) rowRef.current.scrollLeft = 0;
  }, []);

  function handleScroll() {
    const row = rowRef.current;
    const [first, second] = row ? Array.from(row.children) : [];
    if (!row || !(first instanceof HTMLElement) || !(second instanceof HTMLElement)) return;
    const step = second.offsetLeft - first.offsetLeft;
    setActive(Math.min(PLAN_TOPICS.length - 1, Math.max(0, Math.round(row.scrollLeft / step))));
  }

  return (
    // Cards keep their own height; the hero above takes any spare space.
    // Each card is 88% wide, so about 12% of the next one peeks in.
    <section aria-label="Today's plan" className="flex shrink-0 flex-col gap-2 lg:hidden">
      <div
        ref={rowRef}
        onScroll={handleScroll}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overflow-y-hidden px-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6"
      >
        {PLAN_TOPICS.map(({ key, title, icon, tone, art }) => (
          <PlanCard
            key={key}
            title={title}
            icon={icon}
            tone={tone}
            art={art}
            text={guidance[guidanceKey][key]}
            onOpen={() => onOpen(key)}
            compact
            className="w-[88%] shrink-0 snap-start sm:w-[60%]"
          />
        ))}
      </div>
      <div aria-hidden className="flex shrink-0 justify-center gap-1.5">
        {PLAN_TOPICS.map(({ key }, index) => (
          <span
            key={key}
            className={cx("h-1.5 rounded-pill transition-all", index === active ? "w-4 bg-ink" : "w-1.5 bg-ink-muted")}
          />
        ))}
      </div>
    </section>
  );
}
