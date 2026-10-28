"use client";

import { IconCircleCheck, type Icon } from "@tabler/icons-react";
import { useEffect, useEffectEvent } from "react";
import { cx } from "@/lib/cx";

export interface ToastProps {
  message: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Defaults to a check mark, for confirmations.
  icon?: Icon;
  // One optional button, such as Undo. It closes the toast when tapped.
  action?: { label: string; onClick: () => void };
  durationMs?: number;
}

export const TOAST_DURATION_MS = 3000;

// Frosted glass: the see-through surface over a blurred, slightly richer page. Plain --surface where the browser
// cannot blur or the person asked for less transparency, so the text always keeps its contrast.
const GLASS =
  "border border-glass-edge bg-surface supports-[backdrop-filter]:bg-glass supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150 [@media(prefers-reduced-transparency:reduce)]:bg-surface!";

// The live region stays mounted so screen readers announce the message when it appears.
// Under 1024px it drops in at the top, below the notch; from 1024px it sits at the bottom center.
export function Toast({
  message,
  open,
  onOpenChange,
  icon: ToastIcon = IconCircleCheck,
  action,
  durationMs = TOAST_DURATION_MS,
}: ToastProps) {
  const hide = useEffectEvent(() => onOpenChange(false));

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(hide, durationMs);
    return () => clearTimeout(timer);
  }, [open, message, durationMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+12px)] z-50 flex justify-center px-4 [--toast-from:-8px] lg:top-auto lg:bottom-6 lg:[--toast-from:8px]"
    >
      {open && (
        <div
          className={cx(
            "flex items-center gap-2 rounded-pill pl-5 text-body-strong text-ink shadow-raised motion-safe:animate-toast-in",
            GLASS,
            action ? "pointer-events-auto py-1 pr-1" : "py-3 pr-5",
          )}
        >
          <ToastIcon size={20} stroke={1.75} aria-hidden />
          {message}
          {action && (
            <button
              type="button"
              onClick={() => {
                action.onClick();
                onOpenChange(false);
              }}
              className="ml-1 min-h-11 rounded-pill px-4 text-body-strong text-ink underline underline-offset-4 hover:bg-ink/10"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
