import { IconChevronLeft } from "@tabler/icons-react";
import { IconButton } from "@/components/ui/IconButton";

interface ViewHeaderProps {
  id: string;
  title: string;
  onBack: () => void;
  backDisabled?: boolean;
  // Names where the back arrow goes.
  backLabel?: string;
}

// Header of a second view inside a sheet. tabIndex -1 lets the sheet move focus here.
export function ViewHeader({ id, title, onBack, backDisabled, backLabel = "Back to check-in" }: ViewHeaderProps) {
  return (
    <div className="mb-3 flex items-center gap-1">
      <IconButton icon={IconChevronLeft} aria-label={backLabel} onClick={onBack} disabled={backDisabled} className="-ml-3" />
      <h3 id={id} tabIndex={-1} className="text-h2 text-ink focus:outline-none">
        {title}
      </h3>
    </div>
  );
}
