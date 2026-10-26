import type { Icon } from "@tabler/icons-react";
import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> {
  icon: Icon;
  "aria-label": string;
}

export function IconButton({ icon: ButtonIcon, type = "button", className, ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-pill text-ink transition-colors hover:bg-surface-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      <ButtonIcon size={20} stroke={1.75} aria-hidden />
    </button>
  );
}
