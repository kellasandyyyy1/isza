"use client";

import { IconAlertTriangle } from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/IconTile";
import { dismissFlag } from "@/db/repo";
import type { HealthFlag } from "@/lib/flags";

const DISMISS_DAYS = 30;

export function FlagList({ flags }: { flags: HealthFlag[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {flags.map((flag) => (
        <li key={flag.id} className="flex gap-3">
          <IconTile icon={IconAlertTriangle} tone="warning" />
          <div className="flex flex-col items-start gap-1">
            <p className="text-body-strong text-ink">{flag.title}</p>
            <p className="text-body text-ink-muted">{flag.body}</p>
            <Button variant="ghost" size="sm" className="-ml-5" onClick={() => void dismissFlag(flag.id, DISMISS_DAYS)}>
              Dismiss for 30 days
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
