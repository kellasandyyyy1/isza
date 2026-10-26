"use client";

import { motion, useAnimate, useReducedMotion, type TargetAndTransition } from "motion/react";
import Image, { type ImageLoader } from "next/image";
import { useState, type CSSProperties } from "react";
import type { Phase } from "@/lib/cycle";
import { cx } from "@/lib/cx";

export type MascotPose = "today" | "checkin" | "calendar" | "train" | "insights" | "me";
export type MascotSize = "sm" | "md" | "lg";
export type MascotMotion = "idle" | "cheer" | "calm" | "tired" | "none";

export interface MascotSlotProps {
  pose: MascotPose;
  size: MascotSize;
  // Only "cheer" moves her, once. idle, calm, tired and none all stand still.
  motion?: MascotMotion;
  // Loads eagerly with high priority. Only for onboarding screen 1 and Today.
  priority?: boolean;
  // Tints the circle behind her. Without a phase the circle is --surface-2.
  phase?: Phase | null;
  // Changing this number plays the cheer bounce once, for example after a save.
  cheerKey?: number;
  className?: string;
}

// The box is always square, so nothing shifts while the image loads.
const BOX: Record<MascotSize, string> = {
  sm: "clamp(64px, 12dvh, 104px)",
  md: "clamp(96px, 20dvh, 160px)",
  lg: "clamp(160px, 34dvh, 280px)",
};

// The same sizes as media queries for the sizes attribute (vh stands in for dvh there).
const SIZES: Record<MascotSize, string> = {
  sm: "(max-height: 533px) 64px, (max-height: 866px) 12vh, 104px",
  md: "(max-height: 480px) 96px, (max-height: 800px) 20vh, 160px",
  lg: "(max-height: 470px) 160px, (max-height: 823px) 34vh, 280px",
};

const TINTS: Record<Phase, string> = {
  menstrual: "bg-phase-menstrual-tint",
  follicular: "bg-phase-follicular-tint",
  ovulatory: "bg-phase-ovulatory-tint",
  luteal: "bg-phase-luteal-tint",
};

// Prebuilt by scripts/build-mascot.mjs. next.config.ts limits next/image to these widths.
const WIDTHS = [160, 320, 640];
const mascotLoader: ImageLoader = ({ src, width }) => `${src}-${WIDTHS.find((w) => w >= width) ?? 640}.webp`;

// She stands still. Only the entrance, the tap squash and a one-off cheer move her.
const STEADY: TargetAndTransition = { y: 0 };
const CHEER: TargetAndTransition = { y: [0, -14, 0, -6, 0], transition: { duration: 0.6, ease: "easeOut" } };

// Decorative: alt="" and aria-hidden. She never carries meaning that text depends on.
export function MascotSlot({
  pose,
  size,
  motion: motionName = "idle",
  priority = false,
  phase = null,
  cheerKey,
  className,
}: MascotSlotProps) {
  const reduced = useReducedMotion() === true;
  const [scope, animate] = useAnimate<HTMLDivElement>();
  // Cheer plays on mount when asked for, and again whenever cheerKey changes. Then she is still again.
  const [cheering, setCheering] = useState(motionName === "cheer");
  const [seenCheerKey, setSeenCheerKey] = useState(cheerKey);
  if (cheerKey !== seenCheerKey) {
    setSeenCheerKey(cheerKey);
    setCheering(true);
  }

  // Nothing moves with reduced motion.
  const target = !reduced && cheering ? CHEER : STEADY;
  const box: CSSProperties = { width: BOX[size], height: BOX[size] };

  return (
    <motion.div
      aria-hidden="true"
      className={cx("relative shrink-0", className)}
      style={box}
      // The same first frame on server and client; with reduced motion it jumps to the end at once.
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduced ? { duration: 0 } : { type: "spring", duration: 0.35, bounce: 0.25 }}
    >
      <span className={cx("absolute inset-[6%] rounded-pill", phase ? TINTS[phase] : "bg-surface-2")} />
      <motion.div
        ref={scope}
        className="absolute inset-0"
        onTap={() => {
          if (!reduced) void animate(scope.current, { scaleY: [1, 0.94, 1.04, 1] }, { duration: 0.3 });
        }}
      >
        <motion.div
          className="absolute inset-0"
          animate={target}
          onAnimationComplete={() => {
            if (cheering) setCheering(false);
          }}
        >
          <Image
            src={`/mascot/mascot-${pose}`}
            loader={mascotLoader}
            alt=""
            fill
            sizes={SIZES[size]}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            draggable={false}
            className="object-contain select-none"
            style={{ filter: "var(--mascot-glow)" }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
