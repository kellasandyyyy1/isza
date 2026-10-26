"use client";

import { IconSparkles } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MascotSlot } from "@/components/ui/MascotSlot";
import type { HealthFlag } from "@/lib/flags";
import type { Insight } from "@/lib/insights";
import { HealthFlagCard } from "./HealthFlagCard";
import { InsightCard } from "./InsightCard";

const PAGE_SIZE = 5;
const CYCLES_NEEDED = 2;

interface PatternsTabProps {
  flags: HealthFlag[];
  insights: Insight[];
  completedCycles: number;
  onCheckIn: () => void;
}

// Health flags first, then insights 5 at a time.
export function PatternsTab({ flags, insights, completedCycles, onCheckIn }: PatternsTabProps) {
  const [shown, setShown] = useState(PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
      {flags.length > 0 && (
        <section aria-label="Health flags" className="flex flex-col gap-3">
          {flags.map((flag) => (
            <HealthFlagCard key={flag.id} flag={flag} />
          ))}
        </section>
      )}

      {completedCycles < CYCLES_NEEDED ? (
        <div className="flex flex-col items-center">
          <EmptyState
            icon={IconSparkles}
            mascot={{ pose: "insights", size: "lg" }}
            title="Not enough cycles yet"
            text="Your patterns appear after 2 cycles of check-ins."
            action={{ label: "Log today's check-in", onClick: onCheckIn }}
          />
          <p className="-mt-4 text-small text-ink-muted">
            Cycle {completedCycles + 1} of {CYCLES_NEEDED}
          </p>
        </div>
      ) : (
        <section aria-label="Your patterns" className="flex flex-col gap-3">
          <MascotSlot pose="insights" size="sm" className="self-end" />
          {insights.length === 0 && (
            <p className="text-body text-ink-muted">No clear patterns yet. Keep checking in and they will show here.</p>
          )}
          {insights.slice(0, shown).map((insight) => (
            <InsightCard key={insight.text} insight={insight} />
          ))}
          {insights.length > shown && (
            <Button variant="secondary" fullWidth onClick={() => setShown((count) => count + PAGE_SIZE)}>
              Show more
            </Button>
          )}
        </section>
      )}
    </div>
  );
}
