import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";

export function AppearanceSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Appearance" description="System follows your device setting.">
      <ThemeToggle />
    </ResponsiveSheet>
  );
}
