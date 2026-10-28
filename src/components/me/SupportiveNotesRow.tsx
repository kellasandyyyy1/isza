"use client";

import { IconHeartHandshake } from "@tabler/icons-react";
import { Switch } from "@/components/ui/Switch";
import { saveValidationSettings } from "@/db/repo";
import { useValidationSettings } from "@/db/hooks";
import { setValidationEnabled } from "@/lib/validation";

// Inline switch like Discreet mode. Bound to validationCardsEnabled.
export function SupportiveNotesRow() {
  const settings = useValidationSettings();
  return (
    <li className="flex min-h-12 items-center gap-3 px-4">
      <IconHeartHandshake size={20} stroke={1.75} aria-hidden className="shrink-0 text-ink-muted" />
      <div className="min-w-0 flex-1">
        <Switch
          label="Supportive notes"
          description="Short notes when you log a hard day. Never advice, never a diagnosis."
          checked={settings?.validationCardsEnabled ?? true}
          disabled={!settings}
          onCheckedChange={(enabled) => settings && void saveValidationSettings(setValidationEnabled(settings, enabled))}
        />
      </div>
    </li>
  );
}
