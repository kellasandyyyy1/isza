import { IconAlertTriangle } from "@tabler/icons-react";
import { Card } from "@/components/ui/Card";
import type { HealthFlag } from "@/lib/flags";

export function HealthFlagCard({ flag }: { flag: HealthFlag }) {
  return (
    <Card className="flex gap-3">
      <IconAlertTriangle size={20} stroke={1.75} aria-hidden className="mt-0.5 shrink-0 text-warning" />
      <div>
        <h3 className="text-body-strong text-ink">{flag.title}</h3>
        <p className="text-body text-ink-muted">{flag.body}</p>
      </div>
    </Card>
  );
}
