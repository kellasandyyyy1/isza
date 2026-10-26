import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import type { HealthFlag } from "@/lib/flags";
import { FlagList } from "./FlagList";

interface FlagsSheetProps {
  flags: HealthFlag[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FlagsSheet({ flags, open, onOpenChange }: FlagsSheetProps) {
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Health notes">
      <FlagList flags={flags} />
    </ResponsiveSheet>
  );
}
