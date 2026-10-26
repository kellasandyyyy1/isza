"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect } from "react";

const DURATION_S = 0.6;

// Counts from the previous value to the new one, for example after a check-in changes the score.
// The first render shows the value as is; with reduced motion every change is instant.
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const reduced = useReducedMotion() === true;
  const current = useMotionValue(value);
  const rounded = useTransform(current, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(current, value, { duration: reduced ? 0 : DURATION_S, ease: "easeOut" });
    return () => controls.stop();
  }, [current, value, reduced]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
