import { IconCalendarEvent, IconCalendarExclamation } from "@tabler/icons-react";

interface NextPeriodStatProps {
  text: string;
  // Caption lines under the main line: the range with its basis, or the late notes.
  captions: string[];
  late: boolean;
}

// "Period in about 5 days" or "Period is 3 days late", with captions under it. Late is plain ink,
// never red or an alert: it states the fact. The captions start where the text starts, not under the icon.
export function NextPeriodStat({ text, captions, late }: NextPeriodStatProps) {
  const Icon = late ? IconCalendarExclamation : IconCalendarEvent;
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon size={20} stroke={1.75} aria-hidden className={late ? "shrink-0 text-ink" : "shrink-0 text-period"} />
      <p className="flex min-w-0 flex-col gap-0.5">
        <span className="text-body-strong text-ink">{text}</span>
        {captions.map((caption) => (
          <span key={caption} className="text-caption text-ink-muted">
            {caption}
          </span>
        ))}
      </p>
    </div>
  );
}
