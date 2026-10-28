import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { SupportLine } from "@/components/validation/SupportLine";
import { WaterDetails } from "@/components/water/WaterDetails";
import { NOTE_MAX_LENGTH, parseTemperature, type CheckInDraft } from "@/lib/checkin";
import { cx } from "@/lib/cx";
import { LH_OPTIONS } from "./checkinConfig";
import { GroupLabel } from "./GroupLabel";
import { SleepStepper } from "./SleepStepper";
import { ViewHeader } from "./ViewHeader";

interface DetailsViewProps {
  headingId: string;
  // The check-in's date, and whether it is today.
  date: string;
  isToday: boolean;
  draft: CheckInDraft;
  onChange: (patch: Partial<CheckInDraft>) => void;
  onDone: () => void;
}

const fieldClasses =
  "w-full rounded-input border-2 bg-surface-2 px-4 text-body text-ink placeholder:text-ink-muted aria-[invalid=true]:border-danger";

export function DetailsView({ headingId, date, isToday, draft, onChange, onDone }: DetailsViewProps) {
  const ids = { temperature: useId(), temperatureHelp: useId(), lh: useId(), note: useId(), noteCount: useId() };
  const [temperatureText, setTemperatureText] = useState(draft.bbt === null ? "" : String(draft.bbt));
  const temperature = parseTemperature(temperatureText);
  const noteLength = draft.note?.length ?? 0;

  function changeTemperature(text: string) {
    setTemperatureText(text);
    const parsed = parseTemperature(text);
    if (parsed.error === null) onChange({ bbt: parsed.value });
  }

  // An invalid temperature must be fixed or cleared before leaving the view.
  const blocked = temperature.error !== null;

  return (
    <div className="flex flex-col gap-4">
      <ViewHeader id={headingId} title="More details" onBack={onDone} backDisabled={blocked} />

      {/* Today's check-in only: the tally counts glasses today. */}
      {isToday && <WaterDetails today={date} />}

      <SleepStepper value={draft.sleepHours} onChange={(sleepHours) => onChange({ sleepHours })} />

      <div>
        <label htmlFor={ids.temperature} className="mb-1.5 block text-small text-ink-muted">
          Temperature in °C (optional)
        </label>
        <input
          id={ids.temperature}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="36.5"
          value={temperatureText}
          onChange={(event) => changeTemperature(event.target.value)}
          aria-invalid={blocked}
          aria-describedby={ids.temperatureHelp}
          className={cx(fieldClasses, "h-12 border-transparent")}
        />
        <p id={ids.temperatureHelp} className={cx("mt-1 text-small", blocked ? "text-danger" : "text-ink-muted")}>
          {temperature.error ?? "Taken right after waking, from 35.0 to 38.5."}
        </p>
      </div>

      <div>
        <GroupLabel id={ids.lh}>LH test</GroupLabel>
        <div role="group" aria-labelledby={ids.lh} className="flex flex-wrap gap-2">
          {LH_OPTIONS.map((option) => (
            <Chip
              key={option.label}
              selected={draft.lhTest === option.value}
              onClick={() => onChange({ lhTest: option.value })}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor={ids.note} className="mb-1.5 block text-small text-ink-muted">
          Note
        </label>
        <textarea
          id={ids.note}
          rows={3}
          maxLength={NOTE_MAX_LENGTH}
          value={draft.note ?? ""}
          onChange={(event) => onChange({ note: event.target.value === "" ? null : event.target.value })}
          aria-describedby={ids.noteCount}
          className={cx(fieldClasses, "resize-none border-transparent py-3")}
        />
        <p id={ids.noteCount} className="mt-1 text-right text-small text-ink-muted">
          {noteLength}/{NOTE_MAX_LENGTH}
        </p>
      </div>

      <Button fullWidth disabled={blocked} onClick={onDone}>
        Done
      </Button>
      <SupportLine />
    </div>
  );
}
