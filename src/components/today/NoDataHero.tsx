import { IconDroplet } from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function NoDataHero({ onLogPeriod }: { onLogPeriod: () => void }) {
  return (
    <Card className="flex shrink-0 flex-col items-start gap-3">
      <h2 className="text-h2 text-ink">Let&apos;s find your rhythm</h2>
      <p className="text-body text-ink-muted">Log your last period to start.</p>
      <Button icon={IconDroplet} onClick={onLogPeriod}>
        Log period
      </Button>
    </Card>
  );
}
