import { IconPhone } from "@tabler/icons-react";
import { Card } from "@/components/ui/Card";
import type { Helpline } from "@/content/support";

// One helpline: who it is, each number as a tap-to-call link, and the hours. "urgent" tints the card, with the
// heading text saying why, so color is never the only signal.
export function HelplineCard({ line, urgent = false }: { line: Helpline; urgent?: boolean }) {
  return (
    <Card tone={urgent ? "menstrual" : undefined} flat={urgent} className="flex flex-col gap-1">
      <h2 className="text-body-strong text-ink">{line.name}</h2>
      <p className="text-small text-ink-muted">{line.about}</p>
      <ul className="flex flex-wrap gap-x-4">
        {line.phones.map((phone) => (
          <li key={phone}>
            <a
              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
              aria-label={`Call ${line.name}, ${phone}`}
              className="inline-flex min-h-11 items-center gap-2 text-body-strong text-ink underline underline-offset-2"
            >
              <IconPhone size={20} stroke={1.75} aria-hidden />
              {phone}
            </a>
          </li>
        ))}
      </ul>
      <p className="text-small text-ink-muted">{line.hours}</p>
    </Card>
  );
}
