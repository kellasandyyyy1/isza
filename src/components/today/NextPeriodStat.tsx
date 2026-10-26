import { ArtIcon } from "@/components/ui/ArtIcon";

// "Period in about 5 days" as the main line, with the predicted range as a caption under it.
export function NextPeriodStat({ text, range }: { text: string; range: string | null }) {
  return (
    <p className="flex flex-col items-center text-center">
      <span className="flex items-center gap-1.5 text-body-strong text-ink">
        <ArtIcon name="period" size="xs" />
        {text}
      </span>
      {range && <span className="text-caption text-ink-muted">{range}</span>}
    </p>
  );
}
