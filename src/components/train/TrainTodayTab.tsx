import { IconBarbell } from "@tabler/icons-react";
import { PHASE_NAMES } from "@/components/today/todayConfig";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MascotSlot } from "@/components/ui/MascotSlot";
import { bandAdvice, guidance } from "@/content/guidance";
import type { Workout } from "@/db/schema";
import type { TodayView } from "@/lib/today";
import { WorkoutCard } from "./WorkoutCard";

interface TrainTodayTabProps {
  view: TodayView;
  todaysWorkouts: Workout[];
  onLogWorkout: () => void;
  // Bumped after a workout is saved, so the mascot cheers.
  cheerKey: number;
}

export function TrainTodayTab({ view, todaysWorkouts, onLogWorkout, cheerKey }: TrainTodayTabProps) {
  const { readiness, cycle, guidanceKey } = view;
  return (
    <div className="flex h-full flex-col gap-3">
      <MascotSlot pose="train" size="md" motion="idle" cheerKey={cheerKey} className="-my-3 self-center" />
      <Card tone={cycle.phase ?? undefined} className="flex flex-col gap-2">
        <p className="text-small text-ink-muted">
          Readiness {readiness.score}, {readiness.band}
          {cycle.phase ? `. ${PHASE_NAMES[cycle.phase]} phase` : ""}
        </p>
        <p className="text-h2 text-ink">{bandAdvice[readiness.band]}</p>
        <p className="text-body text-ink-muted">{guidance[guidanceKey].train}</p>
      </Card>
      {todaysWorkouts.length > 0 && (
        <section aria-label="Logged today" className="flex flex-col gap-2">
          {todaysWorkouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </section>
      )}
      <div className="mt-auto">
        <Button fullWidth icon={IconBarbell} onClick={onLogWorkout}>
          Log workout
        </Button>
      </div>
    </div>
  );
}
