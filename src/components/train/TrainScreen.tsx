"use client";

import { format } from "date-fns";
import { useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Toast } from "@/components/ui/Toast";
import { useLogs, usePeriods, useProfile, useWorkouts } from "@/db/hooks";
import { buildCalendarContext } from "@/lib/calendar";
import { computeInsights } from "@/lib/insights";
import { buildTodayView } from "@/lib/today";
import { trainingProgress } from "@/lib/training";
import { LogWorkoutSheet } from "./LogWorkoutSheet";
import { ProgressTab } from "./ProgressTab";
import { TrainTodayTab } from "./TrainTodayTab";
import { WorkoutLogTab } from "./WorkoutLogTab";

const ALL_DATES = { from: "0000-01-01", to: "9999-12-31" };

type Tab = "today" | "log" | "progress";

export function TrainScreen() {
  const profile = useProfile();
  const periods = usePeriods();
  const logs = useLogs(ALL_DATES.from, ALL_DATES.to);
  const workouts = useWorkouts(ALL_DATES.from, ALL_DATES.to);
  const [tab, setTab] = useState<Tab>("today");
  const [logOpen, setLogOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [workoutCheer, setWorkoutCheer] = useState(0);

  if (profile === undefined || periods === undefined || logs === undefined || workouts === undefined) {
    return <div aria-busy="true" className="flex-1" />;
  }

  // Data only loads in the browser, so the clock is never read during prerendering.
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const view = buildTodayView({ profile, periods, logs, dismissedFlags: [], now });
  const openLog = () => setLogOpen(true);
  const bestWindow =
    computeInsights({ periods, logs, workouts, profile }).find((insight) => insight.kind === "best-training-window") ?? null;

  // Radix Tabs only mounts the active panel.
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SegmentedControl<Tab>
        aria-label="Train"
        value={tab}
        onValueChange={setTab}
        className="flex min-h-0 flex-1 flex-col [&>[role=tabpanel]]:min-h-0 [&>[role=tabpanel]]:flex-1"
        options={[
          {
            value: "today",
            label: "Today",
            panel: (
              <TrainTodayTab
                view={view}
                todaysWorkouts={workouts.filter((workout) => workout.date === today)}
                onLogWorkout={openLog}
                cheerKey={workoutCheer}
              />
            ),
          },
          {
            value: "log",
            label: "Log",
            panel: (
              <WorkoutLogTab
                workouts={workouts}
                context={buildCalendarContext({ periods, profile, logs, workouts, today })}
                onLogWorkout={openLog}
              />
            ),
          },
          {
            value: "progress",
            label: "Progress",
            panel: (
              <ProgressTab
                progress={trainingProgress(periods, workouts, profile)}
                bestWindow={bestWindow}
                onLogWorkout={openLog}
              />
            ),
          },
        ]}
      />
      <LogWorkoutSheet
        date={today}
        open={logOpen}
        onOpenChange={setLogOpen}
        onSaved={() => {
          setLogOpen(false);
          setToastOpen(true);
          setWorkoutCheer((key) => key + 1);
        }}
      />
      <Toast message="Workout saved" open={toastOpen} onOpenChange={setToastOpen} />
    </div>
  );
}
