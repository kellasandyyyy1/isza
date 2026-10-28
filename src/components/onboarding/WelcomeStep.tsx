import { MascotSlot } from "@/components/ui/MascotSlot";

// The first screen: the mascot popping in softly on a warm glow, and the promise in one line.
export function WelcomeStep({ headingId }: { headingId: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="relative flex items-center justify-center">
        <span aria-hidden className="absolute inset-[8%] rounded-pill bg-primary-tint blur-2xl" />
        <MascotSlot pose="validation" size="lg" motion="pop" priority className="relative" />
      </div>
      <h1 id={headingId} tabIndex={-1} className="text-display text-ink focus:outline-none">
        Because “why am I like this today” deserves an answer.
      </h1>
      <p className="max-w-xs text-body text-ink-muted">Iszacycle matches your training, food and energy to your cycle.</p>
    </div>
  );
}
