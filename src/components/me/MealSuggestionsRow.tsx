"use client";

import { IconToolsKitchen2 } from "@tabler/icons-react";
import { Switch } from "@/components/ui/Switch";
import { saveMealSettings } from "@/db/repo";
import { useMealSettings } from "@/db/hooks";

// Inline switch like Supportive notes. Off: the Food card shows only its phase tip.
export function MealSuggestionsRow() {
  const settings = useMealSettings();
  return (
    <li className="flex min-h-12 items-center gap-3 px-4">
      <IconToolsKitchen2 size={20} stroke={1.75} aria-hidden className="shrink-0 text-ink-muted" />
      <div className="min-w-0 flex-1">
        <Switch
          label="Daily meal ideas"
          description="One easy, affordable meal a day, matched to your phase."
          checked={settings?.mealSuggestionsEnabled ?? true}
          disabled={!settings}
          onCheckedChange={(enabled) => settings && void saveMealSettings({ ...settings, mealSuggestionsEnabled: enabled })}
        />
      </div>
    </li>
  );
}
