"use client";

import { IconEyeOff } from "@tabler/icons-react";
import { Switch } from "@/components/ui/Switch";
import { saveProfile } from "@/db/repo";
import type { Profile } from "@/db/schema";

// The one row with its control inline: a single switch needs no sheet.
export function DiscreetModeRow({ profile }: { profile: Profile | null }) {
  return (
    <li className="flex min-h-12 items-center gap-3 px-4">
      <IconEyeOff size={20} stroke={1.75} aria-hidden className="shrink-0 text-ink-muted" />
      <div className="min-w-0 flex-1">
        <Switch
          label="Discreet mode"
          description="Reminder text never mentions periods or symptoms."
          checked={profile?.discreetMode ?? false}
          disabled={!profile}
          onCheckedChange={(discreetMode) => profile && void saveProfile({ ...profile, discreetMode })}
        />
      </div>
    </li>
  );
}
