import { MascotSlot } from "@/components/ui/MascotSlot";

export function WelcomeStep({ headingId }: { headingId: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <p className="text-h1 text-ink">isza</p>
      <MascotSlot pose="today" size="lg" motion="cheer" priority />
      <h1 id={headingId} tabIndex={-1} className="text-display text-ink focus:outline-none">
        Your cycle, your rhythm.
      </h1>
      <p className="max-w-xs text-body text-ink-muted">Plan training, food and energy around how you actually feel.</p>
    </div>
  );
}
