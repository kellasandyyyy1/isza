import type { Mood } from "@/db/schema";
import { moodSchema } from "@/db/schema";

// Dot sizes in px: a mood never logged stays a small outline, the most logged one is the largest.
const MIN_DOT = 6;
const MAX_DOT = 14;

// One dot per mood, great to bad, sized by how often it was logged. The words beside it carry the meaning.
export function MoodDots({ moodCounts }: { moodCounts: Record<Mood, number> }) {
  const most = Math.max(...moodSchema.options.map((mood) => moodCounts[mood]), 1);
  const label = moodSchema.options.map((mood) => `${mood} ${moodCounts[mood]}`).join(", ");
  return (
    <span role="img" aria-label={`Moods logged: ${label}`} className="flex h-3.5 items-center gap-1">
      {moodSchema.options.map((mood) => {
        const count = moodCounts[mood];
        const size = count === 0 ? MIN_DOT : MIN_DOT + ((MAX_DOT - MIN_DOT) * count) / most;
        return (
          <span
            key={mood}
            data-mood={mood}
            className={count === 0 ? "rounded-pill border border-ink-muted" : "rounded-pill bg-ink"}
            style={{ width: size, height: size }}
          />
        );
      })}
    </span>
  );
}
