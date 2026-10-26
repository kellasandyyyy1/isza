"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAppLock } from "@/db/hooks";
import { LockScreen } from "./LockScreen";

// Back in the foreground after this long, the app locks again.
export const BACKGROUND_LOCK_MS = 5 * 60 * 1000;

// `covered` is true while the lock screen (or the loading cover) hides the app.
const AppLockContext = createContext<{ markUnlocked: () => void; covered: boolean } | null>(null);

// Locks when the app opens with a PIN set, and after 5 minutes in the background.
// Until the lock setting is read, a plain cover hides the app so nothing flashes.
export function AppLockProvider({ children }: { children: ReactNode }) {
  const lock = useAppLock();
  const [unlocked, setUnlocked] = useState(false);
  const hiddenAt = useRef<number | null>(null);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        hiddenAt.current = Date.now();
      } else if (hiddenAt.current !== null && Date.now() - hiddenAt.current >= BACKGROUND_LOCK_MS) {
        setUnlocked(false);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const loading = lock === undefined;
  const locked = lock !== undefined && lock !== null && !unlocked;
  const covered = loading || locked;

  return (
    <AppLockContext value={{ markUnlocked: () => setUnlocked(true), covered }}>
      <div className="contents" inert={covered} aria-hidden={covered || undefined}>
        {children}
      </div>
      {loading && <div aria-busy="true" className="fixed inset-0 z-60 bg-bg" />}
      {locked && <LockScreen lock={lock} onUnlock={() => setUnlocked(true)} />}
    </AppLockContext>
  );
}

// Setting a new PIN calls this first, so turning the lock on does not lock the current visit.
export function useAppLockControls() {
  const context = useContext(AppLockContext);
  if (!context) throw new Error("useAppLockControls must be used inside AppLockProvider.");
  return context;
}
