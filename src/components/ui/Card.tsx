import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

// "surface-2" is a quiet neutral card, for supportive notes.
export type CardTone = "menstrual" | "follicular" | "ovulatory" | "luteal" | "surface-2";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  // A solid tint mixed over --surface instead of a see-through one. Only with a tone.
  flat?: boolean;
}

const toneClasses: Record<CardTone, string> = {
  menstrual: "bg-phase-menstrual-tint",
  follicular: "bg-phase-follicular-tint",
  ovulatory: "bg-phase-ovulatory-tint",
  luteal: "bg-phase-luteal-tint",
  "surface-2": "bg-surface-2",
};

const flatToneClasses: Record<CardTone, string> = {
  menstrual: "bg-phase-menstrual-surface",
  follicular: "bg-phase-follicular-surface",
  ovulatory: "bg-phase-ovulatory-surface",
  luteal: "bg-phase-luteal-surface",
  "surface-2": "bg-surface-2",
};

export function Card({ tone, flat = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        "rounded-card border border-edge p-5 shadow-card",
        tone ? (flat ? flatToneClasses : toneClasses)[tone] : "bg-surface",
        className,
      )}
      {...rest}
    />
  );
}
