"use client";

import { motion, useAnimate, useReducedMotion, type TargetAndTransition } from "motion/react";
import Image, { type ImageLoader } from "next/image";
import { useState, type CSSProperties } from "react";
import { cx } from "@/lib/cx";

export type MascotPose =
  | "today"
  | "checkin"
  | "calendar"
  | "train"
  | "insights"
  | "me"
  // Today's hero shows the pose for the current phase.
  | "menstrual"
  | "follicular"
  | "ovulatory"
  | "luteal"
  // The Water card on Today.
  | "water"
  // The first onboarding screen.
  | "validation";
// "fill" is as tall as its parent (which needs a definite height), square, at most 260px and the parent's width.
// "column" is 85% of its parent's height (which needs a definite height) and 3:4, for a figure in a narrow column.
export type MascotSize = "sm" | "md" | "lg" | "fill" | "column";
export type MascotMotion = "idle" | "cheer" | "calm" | "tired" | "none" | "pop";

export interface MascotSlotProps {
  pose: MascotPose;
  size: MascotSize;
  // Only "cheer" and "pop" move her, once. idle, calm, tired and none all stand still.
  motion?: MascotMotion;
  // Loads eagerly with high priority. Only for onboarding screen 1 and Today.
  priority?: boolean;
  // Changing this number plays the cheer bounce once, for example after a save.
  cheerKey?: number;
  className?: string;
}

// The box is always square, so nothing shifts while the image loads.
const BOX: Record<MascotSize, CSSProperties> = {
  sm: { width: "clamp(64px, 12dvh, 104px)", height: "clamp(64px, 12dvh, 104px)" },
  md: { width: "clamp(96px, 20dvh, 160px)", height: "clamp(96px, 20dvh, 160px)" },
  lg: { width: "clamp(160px, 34dvh, 280px)", height: "clamp(160px, 34dvh, 280px)" },
  fill: { height: "100%", maxHeight: "260px", maxWidth: "100%", aspectRatio: "1" },
  column: { height: "85%", aspectRatio: "3 / 4" },
};

// The same sizes as media queries for the sizes attribute (vh stands in for dvh there).
const SIZES: Record<MascotSize, string> = {
  sm: "(max-height: 533px) 64px, (max-height: 866px) 12vh, 104px",
  md: "(max-height: 480px) 96px, (max-height: 800px) 20vh, 160px",
  lg: "(max-height: 470px) 160px, (max-height: 823px) 34vh, 280px",
  fill: "(max-height: 700px) 180px, 260px",
  column: "(max-height: 866px) 104px, 140px",
};

// Prebuilt by scripts/build-mascot.mjs. next.config.ts limits next/image to these widths.
const WIDTHS = [160, 320, 640];
const mascotLoader: ImageLoader = ({ src, width }) => `${src}-${WIDTHS.find((w) => w >= width) ?? 640}.webp`;

// She is simply there when a screen opens: no entrance. Only the tap squash and a one-off cheer move her.
const STEADY: TargetAndTransition = { y: 0 };
const CHEER: TargetAndTransition = { y: [0, -14, 0, -6, 0], transition: { duration: 0.6, ease: "easeOut" } };
// The shadow tightens and fades while she is in the air, so the cheer reads as a real hop.
const SHADOW_STEADY: TargetAndTransition = { scale: 1, opacity: 1 };
const SHADOW_CHEER: TargetAndTransition = {
  scale: [1, 0.72, 1, 0.86, 1],
  opacity: [1, 0.55, 1, 0.8, 1],
  transition: { duration: 0.6, ease: "easeOut" },
};

// "pop": she scales up softly from 92% while fading in, once. The curve never overshoots, so there is no bounce,
// and she does not drift, so there is no float.
const POP_FROM = { opacity: 0, scale: 0.92 };
const POP_TO: TargetAndTransition = { opacity: 1, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } };

// Decorative: alt="" and aria-hidden. She never carries meaning that text depends on.
export function MascotSlot({ pose, size, motion: motionName = "idle", priority = false, cheerKey, className }: MascotSlotProps) {
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
  const shadowTarget = !reduced && cheering ? SHADOW_CHEER : SHADOW_STEADY;
  const pop = motionName === "pop" && !reduced;
  // Only the pop needs a motion box; every other mascot is a plain one.
  const Box = pop ? motion.div : "div";
  return (
    <Box
      aria-hidden="true"
      className={cx("relative shrink-0 origin-bottom", className)}
      style={BOX[size]}
      {...(pop ? { initial: POP_FROM, animate: POP_TO } : {})}
    >
      {/* No frame or glow: a soft floor shadow under her feet grounds her on every page. */}
      <motion.span
        className="absolute bottom-[2%] left-[17%] h-[10%] w-[66%] bg-[radial-gradient(closest-side,var(--mascot-shadow),transparent)]"
        animate={shadowTarget}
      />
      <motion.div
        ref={scope}
        // Squashes from her feet, so she never lifts off the floor.
        className="absolute inset-0 origin-bottom"
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
            // Bottom aligned, so her feet stay on the floor shadow when a "fill" box is taller than wide. A "column"
            // box crops only the square image's empty sides, so the figure itself runs its full height.
            className={cx(size === "column" ? "object-cover" : "object-contain", "object-bottom select-none")}
          />
        </motion.div>
      </motion.div>
    </Box>
  );
}
