import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";

const REASONS = {
  hormonal: "Hormonal contraception changes your natural cycle, so Iszacycle does not show phases or ovulation.",
  irregular: "Your cycle lengths vary a lot, so phase predictions would not be reliable yet.",
};

interface HiddenPhasesSheetProps {
  mode: keyof typeof REASONS;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HiddenPhasesSheet({ mode, open, onOpenChange }: HiddenPhasesSheetProps) {
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Why phases are hidden">
      <p className="text-body text-ink">{REASONS[mode]}</p>
    </ResponsiveSheet>
  );
}
