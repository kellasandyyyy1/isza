import type { ReactNode } from "react";
import { clamp } from "@/lib/clamp";
import { cx } from "@/lib/cx";

export type ProgressRingColor =
  | "ink"
  | "menstrual"
  | "follicular"
  | "ovulatory"
  | "luteal"
  | "success"
  | "warning"
  | "danger";

export interface ProgressRingProps {
  value: number;
  label: string;
  color?: ProgressRingColor;
  // Drawing size in px. The ring scales to displaySize when given.
  size?: number;
  // Any CSS length, for example "clamp(112px, 26dvh, 196px)".
  displaySize?: string;
  strokeWidth?: number;
  children?: ReactNode;
}

const strokeClasses: Record<ProgressRingColor, string> = {
  ink: "stroke-ink",
  menstrual: "stroke-phase-menstrual",
  follicular: "stroke-phase-follicular",
  ovulatory: "stroke-phase-ovulatory",
  luteal: "stroke-phase-luteal",
  success: "stroke-success",
  warning: "stroke-warning",
  danger: "stroke-danger",
};

export function ProgressRing({
  value,
  label,
  color = "ink",
  size = 120,
  displaySize,
  strokeWidth = 10,
  children,
}: ProgressRingProps) {
  const cssSize = displaySize ?? `${size}px`;
  const percent = clamp(value, 0, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: cssSize, height: cssSize }}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} aria-hidden className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-ring-track"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cx(strokeClasses[color], "motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500")}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center text-center">{children}</div>}
    </div>
  );
}
