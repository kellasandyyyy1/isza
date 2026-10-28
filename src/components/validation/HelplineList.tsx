import { EMERGENCY, HELPLINES, WHEN_TO_REACH_OUT, WHEN_TO_REACH_OUT_END } from "@/content/support";
import { HelplineCard } from "./HelplineCard";

// The /support page body: emergency first, then the helplines, when reaching out is worth it, and a plain note
// that nothing she writes is monitored.
export function HelplineList() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <p className="text-body text-ink">Talking to someone can help. These lines are free and private.</p>
      <HelplineCard line={EMERGENCY} urgent />
      <ul className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
        {HELPLINES.map((line) => (
          <li key={line.name} className="flex flex-col *:flex-1">
            <HelplineCard line={line} />
          </li>
        ))}
      </ul>
      <section aria-labelledby="reach-out" className="flex flex-col gap-2">
        <h2 id="reach-out" className="text-h2 text-ink">
          When to reach out
        </h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-body text-ink-muted">
          {WHEN_TO_REACH_OUT.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="text-body text-ink">{WHEN_TO_REACH_OUT_END}</p>
      </section>
      <p className="text-small text-ink-muted">
        Iszacycle does not monitor what you write. Your notes stay on this device and nobody reads them.
      </p>
    </div>
  );
}
