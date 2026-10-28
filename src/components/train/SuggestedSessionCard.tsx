import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PlanWorkoutType } from "@/content/training";
import { workoutTypeInfo } from "./workoutConfig";

export interface PlanSession {
  type: PlanWorkoutType;
  title: string;
  durationMin: number;
  // Out of 10, as shown: "7 to 8" or "7".
  effort: string;
}

interface SuggestedSessionCardProps {
  session: PlanSession;
  phaseNote: string | null;
  onStart: () => void;
}

export function SuggestedSessionCard({ session, phaseNote, onStart }: SuggestedSessionCardProps) {
  const { icon: TypeIcon } = workoutTypeInfo(session.type);
  return (
    <Card aria-label="Suggested session" role="region" className="flex shrink-0 flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-surface-2 text-ink">
          <TypeIcon size={20} stroke={1.75} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-body-strong text-ink">{session.title}</p>
          <p className="flex flex-wrap gap-x-3 text-small text-ink-muted">
            <span>{session.durationMin} min</span>
            <span>Effort {session.effort} of 10</span>
          </p>
        </div>
      </div>
      {phaseNote && <p className="text-small text-ink">{phaseNote}</p>}
      <Button fullWidth onClick={onStart}>
        Start this workout
      </Button>
    </Card>
  );
}
