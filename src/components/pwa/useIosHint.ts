"use client";

import { useSyncExternalStore } from "react";
import { needsIosInstallHint } from "@/lib/pwa";

const subscribeNever = () => () => {};

// True on iPhone or iPad when Isza is not opened from the Home Screen (display-mode: standalone).
// There, install and push need the app on the Home Screen first. False during server rendering.
export function useIosHint(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () =>
      needsIosInstallHint(
        navigator.userAgent,
        navigator.maxTouchPoints,
        window.matchMedia("(display-mode: standalone)").matches ||
          ("standalone" in navigator && navigator.standalone === true),
      ),
    () => false,
  );
}
