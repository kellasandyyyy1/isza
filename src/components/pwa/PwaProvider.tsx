"use client";

import { SerwistProvider } from "@serwist/next/react";
import { useEffect, type ReactNode } from "react";
import { listenForInstallPrompt } from "./installPrompt";

// Off in development so code changes always show up, unless NEXT_PUBLIC_SW_IN_DEV=1 is set to try
// push locally (with `npx serwist build serwist.config.mjs --watch`, which builds without a precache).
const workerOff = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_SW_IN_DEV !== "1";

// Registers the service worker and keeps the install prompt for later.
export function PwaProvider({ children }: { children: ReactNode }) {
  useEffect(() => listenForInstallPrompt(), []);
  return (
    // reloadOnOnline off: a reload when the connection returns would throw away a half-filled
    // check-in, and it cancelled navigations in tests. Nothing in the app needs the network to show.
    <SerwistProvider swUrl="/sw.js" disable={workerOff} reloadOnOnline={false}>
      {children}
    </SerwistProvider>
  );
}
