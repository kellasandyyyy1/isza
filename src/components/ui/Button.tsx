import { IconLoader2, type Icon } from "@tabler/icons-react";
import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: Icon;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary/90",
  secondary: "bg-surface-2 text-ink hover:bg-line",
  ghost: "bg-transparent text-ink hover:bg-surface-2",
  // For actions that delete data. 5.47:1 light, 5.10:1 dark.
  danger: "bg-danger text-on-primary hover:bg-danger/90",
};

// sm is 40px tall visually; the ::after layer extends the touch target to 44px.
const sizeClasses: Record<ButtonSize, string> = {
  md: "h-12 px-6",
  sm: "h-10 px-5 after:absolute after:inset-x-0 after:-inset-y-0.5",
};

export function Button({
  variant = "primary",
  size = "md",
  icon: LeftIcon,
  loading = false,
  fullWidth = false,
  disabled,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "relative inline-flex items-center justify-center gap-2 rounded-pill text-body-strong transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <IconLoader2 size={20} stroke={1.75} aria-hidden className="motion-safe:animate-spin" />
      ) : (
        LeftIcon && <LeftIcon size={20} stroke={1.75} aria-hidden />
      )}
      {children}
    </button>
  );
}
