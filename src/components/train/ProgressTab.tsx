import { IconChartBar } from "@tabler/icons-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Insight } from "@/lib/insights";
import type { TrainingProgress } from "@/lib/training";
import { StrongShareChart } from "./StrongShareChart";

interface ProgressTabProps {
  progress: TrainingProgress;
  bestWindow: Insight | null;
  onLogWorkout: () => void;
}

export function ProgressTab({ progress, bestWindow, onLogWorkout }: ProgressTabProps) {
  if (!progress.available) {
    return (
      <EmptyState
        icon={IconChartBar}
        mascot={{ pose: "train" }}
        title="Not enough data yet"
        text="Log workouts for 2 cycles to see your strongest phase."
        action={{ label: "Log workout", onClick: onLogWorkout }}
      />
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-h2 text-ink">Strong sessions by phase</h2>
      <StrongShareChart shares={progress.shares} />
      {bestWindow && <p className="text-body text-ink">{bestWindow.text}</p>}
      <p className="text-small text-ink-muted">From {progress.cyclesWithWorkouts} completed cycles.</p>
    </Card>
  );
}
