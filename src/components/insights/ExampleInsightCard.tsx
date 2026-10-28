import { Card } from "@/components/ui/Card";
import { cx } from "@/lib/cx";

// A preview of what a real insight will look like: a normal card, faded, with an Example chip. Not interactive and
// not her data, so it says so. 64% is the lowest opacity at which its text keeps 4.5:1 in light mode.
export function ExampleInsightCard({ className }: { className?: string }) {
  return (
    <Card
      aria-label="Example of a future insight"
      role="region"
      className={cx("flex shrink-0 flex-col items-start gap-2 opacity-64", className)}
    >
      <span className="rounded-pill bg-surface-2 px-3 py-1 text-caption text-ink">Example</span>
      <p className="text-small text-ink">Cramps often show up in your luteal phase (3 of your last 4 cycles).</p>
    </Card>
  );
}
