import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import type { Readiness } from "@/lib/readiness";
import { ReadinessBreakdown } from "./ReadinessBreakdown";

interface ReadinessSheetProps {
  readiness: Readiness;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReadinessSheet({ readiness, open, onOpenChange }: ReadinessSheetProps) {
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Readiness ${readiness.score}`}
      description="How today's score adds up."
    >
      <ReadinessBreakdown readiness={readiness} />
    </ResponsiveSheet>
  );
}
