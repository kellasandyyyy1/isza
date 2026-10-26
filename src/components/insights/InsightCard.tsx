import { IconBarbell, IconBolt, IconNotes, type Icon } from "@tabler/icons-react";
import { Card } from "@/components/ui/Card";
import type { Insight, InsightKind } from "@/lib/insights";

const KIND_ICONS: Record<InsightKind, Icon> = {
  "symptom-pattern": IconNotes,
  "energy-by-phase": IconBolt,
  "best-training-window": IconBarbell,
};

export function InsightCard({ insight }: { insight: Insight }) {
  const KindIcon = KIND_ICONS[insight.kind];
  return (
    <Card className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-surface-2 text-ink">
        <KindIcon size={20} stroke={1.75} aria-hidden />
      </span>
      <p className="text-body text-ink">{insight.text}</p>
    </Card>
  );
}
