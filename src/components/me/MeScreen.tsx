"use client";

import {
  IconAdjustmentsHorizontal,
  IconBell,
  IconDownload,
  IconInfoCircle,
  IconLock,
  IconPalette,
  IconShoppingBag,
  IconTrash,
  IconUpload,
  IconUser,
} from "@tabler/icons-react";
import { useState } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Toast } from "@/components/ui/Toast";
import { useAppLock, useMealSettings, useProfile, useReminders, useSupplies } from "@/db/hooks";
import { isLow } from "@/lib/supplies";
import { AboutSheet } from "./AboutSheet";
import { MealPreferencesSheet } from "./MealPreferencesSheet";
import { MealSuggestionsRow } from "./MealSuggestionsRow";
import { AppearanceSheet } from "./AppearanceSheet";
import { AppLockSheet } from "./AppLockSheet";
import { DeleteAllSheet } from "./DeleteAllSheet";
import { DiscreetModeRow } from "./DiscreetModeRow";
import { ExportSheet } from "./ExportSheet";
import { ImportSheet } from "./ImportSheet";
import { MeGroup } from "./MeGroup";
import { MeRow } from "./MeRow";
import { ProfileSheet } from "./ProfileSheet";
import { RemindersSheet } from "./RemindersSheet";
import { SuppliesSheet } from "./SuppliesSheet";
import { SupportiveNotesRow } from "./SupportiveNotesRow";
import { SupportLine } from "@/components/validation/SupportLine";
import { WaterSettingsSection } from "@/components/water/WaterSettingsSection";

type SheetName =
  | "reminders"
  | "supplies"
  | "profile"
  | "appearance"
  | "lock"
  | "export"
  | "import"
  | "delete"
  | "about"
  | "meals";

const THEME_NAMES = { system: "System", light: "Light", dark: "Dark" };
const BUDGET_NAMES = { 1: "Tight", 2: "Normal", 3: "Flexible" } as const;
const STYLE_NAMES = { mixed: "Mixed", filipino: "Filipino", simple: "Simple" } as const;

export function MeScreen() {
  const profile = useProfile();
  const reminders = useReminders();
  const supplies = useSupplies();
  const lock = useAppLock();
  const mealSettings = useMealSettings();
  const { theme } = useTheme();
  const [sheet, setSheet] = useState<SheetName | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (profile === undefined || reminders === undefined || supplies === undefined || lock === undefined) {
    return <div aria-busy="true" className="flex-1" />;
  }

  const open = (name: SheetName) => () => setSheet(name);
  const toggle = (name: SheetName) => (next: boolean) => setSheet(next ? name : null);
  const done = (message: string) => {
    setSheet(null);
    setToast(message);
  };
  const enabledReminders = reminders.filter((reminder) => reminder.enabled).length;
  const lowSupplies = supplies.filter(isLow).length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <MeGroup title="Daily">
        <MeRow
          icon={IconBell}
          label="Reminders"
          value={reminders.length === 0 ? "None" : `${enabledReminders} on`}
          onClick={open("reminders")}
        />
        <MeRow
          icon={IconShoppingBag}
          label="Supplies"
          value={supplies.length === 0 ? "None" : lowSupplies > 0 ? `${lowSupplies} low` : `${supplies.length} items`}
          onClick={open("supplies")}
        />
      </MeGroup>

      <WaterSettingsSection />

      <MeGroup title="Meals">
        <MealSuggestionsRow />
        {mealSettings && (
          <MeRow
            icon={IconAdjustmentsHorizontal}
            label="Meal preferences"
            value={`${BUDGET_NAMES[mealSettings.maxCostTier]}, ${STYLE_NAMES[mealSettings.cuisinePreference]}`}
            onClick={open("meals")}
          />
        )}
      </MeGroup>

      <MeGroup title="App">
        <MeRow icon={IconUser} label="Profile" value={profile?.name ?? undefined} onClick={open("profile")} />
        <MeRow icon={IconPalette} label="Appearance" value={THEME_NAMES[theme]} onClick={open("appearance")} />
      </MeGroup>

      <MeGroup title="Privacy">
        <DiscreetModeRow profile={profile} />
        <SupportiveNotesRow />
        <MeRow icon={IconLock} label="App lock" value={lock ? "On" : "Off"} onClick={open("lock")} />
        <MeRow icon={IconDownload} label="Export data" onClick={open("export")} />
        <MeRow icon={IconUpload} label="Import data" onClick={open("import")} />
        <MeRow icon={IconTrash} label="Delete all data" danger onClick={open("delete")} />
      </MeGroup>

      <MeGroup title="About">
        <MeRow icon={IconInfoCircle} label="About Iszacycle" onClick={open("about")} />
      </MeGroup>

      <SupportLine />

      <RemindersSheet
        open={sheet === "reminders"}
        onOpenChange={toggle("reminders")}
        reminders={reminders}
        discreet={profile?.discreetMode ?? false}
      />
      <SuppliesSheet open={sheet === "supplies"} onOpenChange={toggle("supplies")} supplies={supplies} pose="me" />
      <ProfileSheet open={sheet === "profile"} onOpenChange={toggle("profile")} profile={profile} onSaved={() => done("Profile saved")} />
      <AppearanceSheet open={sheet === "appearance"} onOpenChange={toggle("appearance")} />
      <AppLockSheet open={sheet === "lock"} onOpenChange={toggle("lock")} lock={lock} onChanged={done} />
      <ExportSheet open={sheet === "export"} onOpenChange={toggle("export")} onExported={() => done("Backup downloaded")} />
      <ImportSheet open={sheet === "import"} onOpenChange={toggle("import")} onImported={() => done("Data imported")} />
      <DeleteAllSheet open={sheet === "delete"} onOpenChange={toggle("delete")} />
      <AboutSheet open={sheet === "about"} onOpenChange={toggle("about")} />
      {mealSettings && <MealPreferencesSheet open={sheet === "meals"} onOpenChange={toggle("meals")} settings={mealSettings} />}
      <Toast message={toast ?? ""} open={toast !== null} onOpenChange={(next) => !next && setToast(null)} />
    </div>
  );
}
