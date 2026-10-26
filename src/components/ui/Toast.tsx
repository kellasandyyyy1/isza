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

// The live region stays mounted so screen readers announce the message when it appears.
// Under 1024px it sits above the bottom tab bar.
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
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 pb-[env(safe-area-inset-bottom)] lg:bottom-6"
    >
      {open && (
        <div
          className={cx(
            "flex items-center gap-2 rounded-pill bg-ink pl-5 text-body-strong text-bg shadow-raised motion-safe:animate-toast-in",
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
              className="ml-1 min-h-11 rounded-pill px-4 text-body-strong text-bg underline underline-offset-4 hover:bg-bg/10 focus-visible:outline-bg"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
