/// <reference lib="webworker" />
// Service worker, bundled by `serwist build` after `next build`. Precaches the app shell and every
// prerendered route, so the app works offline after the first visit. It also shows push reminders.
// It never sends health data anywhere.
import { defaultCache } from "@serwist/next/worker";
import { Serwist, type PrecacheEntry, type SerwistGlobalConfig } from "serwist";
// A relative path: the service worker bundle does not resolve the "@/" alias.
import { localDateKey, shouldSuppressWaterReminder } from "../lib/water";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// Push reminders. The server sends fixed, neutral text.

interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

function readPayload(event: PushEvent): PushPayload {
  const fallback: PushPayload = { title: "Iszacycle", body: "You have a reminder.", url: "/today", tag: "reminder" };
  try {
    const data: unknown = event.data?.json();
    if (typeof data !== "object" || data === null) return fallback;
    const field = (key: keyof PushPayload) => {
      const value = (data as Record<string, unknown>)[key];
      return typeof value === "string" && value.length > 0 ? value : fallback[key];
    };
    // Only same-site paths are opened.
    const url = field("url");
    return { title: field("title"), body: field("body"), url: url.startsWith("/") ? url : "/today", tag: field("tag") };
  } catch {
    return fallback;
  }
}

// A water reminder stays quiet when a glass was logged in the last hour. If the tally cannot be read,
// the reminder shows as usual.
async function waterLoggedRecently(now: Date): Promise<boolean> {
  try {
    const log = await readRecord("waterLogs", localDateKey(now));
    if (typeof log !== "object" || log === null) return false;
    const { count, updatedAt } = log as { count?: unknown; updatedAt?: unknown };
    if (typeof count !== "number" || typeof updatedAt !== "string") return false;
    return shouldSuppressWaterReminder({ count, updatedAt }, now);
  } catch {
    return false;
  }
}

self.addEventListener("push", (event) => {
  const { title, body, url, tag } = readPayload(event);
  event.waitUntil(
    (async () => {
      if (tag === "water" && (await waterLoggedRecently(new Date()))) return;
      await self.registration.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.png",
        tag,
        data: { url },
      });
    })(),
  );
});

// Focus an open Iszacycle window and take it to the right screen, or open a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data: unknown = event.notification.data;
  const path =
    typeof data === "object" && data !== null && typeof (data as { url?: unknown }).url === "string"
      ? (data as { url: string }).url
      : "/today";
  const target = new URL(path, self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (open) {
        await open.focus();
        await open.navigate(target);
        return;
      }
      await self.clients.openWindow(target);
    })(),
  );
});

// Reads one record from the app's IndexedDB database ("isza", the legacy name kept for data continuity; made by
// Dexie in the page, see src/db/db.ts).
function readRecord(store: "settings" | "profile" | "waterLogs", key: string): Promise<unknown> {
  return new Promise((resolve) => {
    const request = indexedDB.open("isza");
    request.onerror = () => resolve(undefined);
    request.onsuccess = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(store)) {
        database.close();
        resolve(undefined);
        return;
      }
      const read = database.transaction(store, "readonly").objectStore(store).get(key);
      read.onsuccess = () => {
        database.close();
        resolve(read.result);
      };
      read.onerror = () => {
        database.close();
        resolve(undefined);
      };
    };
  });
}

// The browser replaced the subscription: subscribe again with the same VAPID key and tell the server.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const applicationServerKey = event.oldSubscription?.options.applicationServerKey;
      const subscription =
        event.newSubscription ??
        (applicationServerKey
          ? await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
          : null);
      const deviceSetting = await readRecord("settings", "deviceId");
      const deviceId =
        typeof deviceSetting === "object" && deviceSetting !== null ? (deviceSetting as { value?: unknown }).value : null;
      if (!subscription || typeof deviceId !== "string") return;
      const profile = await readRecord("profile", "me");
      const discreet =
        typeof profile === "object" && profile !== null && (profile as { discreetMode?: unknown }).discreetMode === true;
      const keys = subscription.toJSON().keys ?? {};
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          subscription: { endpoint: subscription.endpoint, keys: { p256dh: keys.p256dh ?? "", auth: keys.auth ?? "" } },
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          discreet,
        }),
      });
    })(),
  );
});
