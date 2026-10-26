import type { DailyLog, Workout } from "@/db/schema";
import { BLEEDING_OPTIONS, MOOD_OPTIONS } from "@/components/checkin/checkinConfig";
import { SYMPTOM_LEVEL_NAMES } from "@/lib/checkin";
import { SYMPTOM_LABELS } from "@/lib/insights";

const WORKOUT_NAMES: Record<Workout["type"], string> = {
  strength: "Strength",
  hiit: "HIIT",
  cardio: "Cardio",
  mobility: "Mobility",
  sport: "Sport",
  rest: "Rest",
};

function rows(log: DailyLog): { label: string; value: string }[] {
  const list = [{ label: "Bleeding", value: BLEEDING_OPTIONS.find((o) => o.value === log.bleeding)?.label ?? "" }];
  if (log.energy !== null) list.push({ label: "Energy", value: `${log.energy} of 5` });
  if (log.mood !== null) list.push({ label: "Mood", value: MOOD_OPTIONS.find((o) => o.value === log.mood)?.label ?? "" });
  if (log.symptoms.length > 0) {
    list.push({
      label: "Symptoms",
      value: log.symptoms.map((s) => `${SYMPTOM_LABELS[s.key]} (${SYMPTOM_LEVEL_NAMES[s.severity]})`).join(", "),
    });
  }
  if (log.sleepHours !== null) list.push({ label: "Sleep", value: `${log.sleepHours} hours` });
  if (log.bbt !== null) list.push({ label: "Temperature", value: `${log.bbt} °C` });
  if (log.lhTest !== null) list.push({ label: "LH test", value: log.lhTest === "positive" ? "Positive" : "Negative" });
  if (log.note) list.push({ label: "Note", value: log.note });
  return list;
}

export function LogSummary({ log, workouts }: { log: DailyLog | null; workouts: Workout[] }) {
  return (
    <div className="flex flex-col gap-3">
      {log ? (
        <dl className="flex flex-col gap-1.5 text-body">
          {rows(log).map(({ label, value }) => (
            <div key={label} className="flex gap-3">
              <dt className="w-24 shrink-0 text-ink-muted">{label}</dt>
              <dd className="min-w-0 text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-body text-ink-muted">No check-in for this day.</p>
      )}
      {workouts.length > 0 && (
        <div>
          <p className="mb-1 text-small text-ink-muted">Workout</p>
          <ul className="flex flex-col gap-1 text-body text-ink">
            {workouts.map((workout, index) => (
              <li key={workout.id ?? index}>
                {WORKOUT_NAMES[workout.type]}, {workout.durationMin} min, felt {workout.feel}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
