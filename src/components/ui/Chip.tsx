import { IconCheck, type Icon } from "@tabler/icons-react";
import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { SELECTED_CLASSES, UNSELECTED_CLASSES } from "@/components/ui/selection";

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-pressed"> {
  selected?: boolean;
  icon?: Icon;
  // "compact" fills its grid cell and lets a long label wrap to two lines.
  size?: "md" | "compact";
}

// When selected, a check icon replaces the leading icon so the state is not shown by color alone.
export function Chip({
  selected = false,
  icon: ChipIcon,
  size = "md",
  type = "button",
  className,
  children,
  ...rest
}: ChipProps) {
  const LeadingIcon = selected ? IconCheck : ChipIcon;
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx(
        "inline-flex items-center rounded-pill text-small transition-colors",
        size === "md" ? "h-11 gap-2 px-4" : "min-h-11 w-full justify-center gap-1 px-2 py-1 text-center leading-tight",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected ? SELECTED_CLASSES : UNSELECTED_CLASSES,
        className,
      )}
      {...rest}
    >
      {LeadingIcon && <LeadingIcon size={20} stroke={1.75} aria-hidden className="shrink-0" />}
      {children}
    </button>
  );
}
