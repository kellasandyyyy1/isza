"use client";

import {
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
import { useAppLock, useProfile, useReminders, useSupplies } from "@/db/hooks";
import { isLow } from "@/lib/supplies";
import { AboutSheet } from "./AboutSheet";
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

type SheetName = "reminders" | "supplies" | "profile" | "appearance" | "lock" | "export" | "import" | "delete" | "about";

const THEME_NAMES = { system: "System", light: "Light", dark: "Dark" };

export function MeScreen() {
  const profile = useProfile();
  const reminders = useReminders();
  const supplies = useSupplies();
  const lock = useAppLock();
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

      <MeGroup title="App">
        <MeRow icon={IconUser} label="Profile" value={profile?.name ?? undefined} onClick={open("profile")} />
        <MeRow icon={IconPalette} label="Appearance" value={THEME_NAMES[theme]} onClick={open("appearance")} />
      </MeGroup>

      <MeGroup title="Privacy">
        <DiscreetModeRow profile={profile} />
        <MeRow icon={IconLock} label="App lock" value={lock ? "On" : "Off"} onClick={open("lock")} />
        <MeRow icon={IconDownload} label="Export data" onClick={open("export")} />
        <MeRow icon={IconUpload} label="Import data" onClick={open("import")} />
        <MeRow icon={IconTrash} label="Delete all data" danger onClick={open("delete")} />
      </MeGroup>

      <MeGroup title="About">
        <MeRow icon={IconInfoCircle} label="About Isza" onClick={open("about")} />
      </MeGroup>

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
      <Toast message={toast ?? ""} open={toast !== null} onOpenChange={(next) => !next && setToast(null)} />
    </div>
  );
}
