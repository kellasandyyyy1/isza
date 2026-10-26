"use client";

import { useSyncExternalStore } from "react";
import { getBrowserSubscription, isPushSupported } from "@/lib/push-client";

// Shared by the background sync and the switch in Reminders.
interface PushStatus {
  // Null until checked. True when this browser has a push subscription.
  subscribed: boolean | null;
  // True when the last sync could not reach the server.
  pending: boolean;
}

let status: PushStatus = { subscribed: null, pending: false };
const listeners = new Set<() => void>();
const SERVER_STATUS: PushStatus = { subscribed: null, pending: false };

export function setPushStatus(patch: Partial<PushStatus>) {
  status = { ...status, ...patch };
  listeners.forEach((listener) => listener());
}

export function usePushStatus(): PushStatus {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => status,
    () => SERVER_STATUS,
  );
}

// Reads the browser's subscription once, so the switch and sync start from the truth.
export async function refreshPushSubscribed(): Promise<void> {
  if (!isPushSupported()) {
    setPushStatus({ subscribed: false });
    return;
  }
  setPushStatus({ subscribed: (await getBrowserSubscription().catch(() => null)) !== null });
}
