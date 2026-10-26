import { cx } from "@/lib/cx";

export interface StepDotsProps {
  total: number;
  // 1-based number of the current step.
  step: number;
}

// The current step is a wider pill, so position is not shown by color alone.
export function StepDots({ total, step }: StepDotsProps) {
  return (
    <div role="img" aria-label={`Step ${step} of ${total}`} className="flex items-center gap-2">
      {Array.from({ length: total }, (_, index) => {
        const number = index + 1;
        return (
          <span
            key={number}
            className={cx(
              "h-2 rounded-pill transition-all",
              number === step ? "w-6 bg-ink" : "w-2",
              number < step && "bg-ink",
              number > step && "bg-ink-muted",
            )}
          />
        );
      })}
    </div>
  );
}
