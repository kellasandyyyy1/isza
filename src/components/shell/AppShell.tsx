import type { ReactNode } from "react";
import { PushSync } from "@/components/push/PushSync";
import { BottomTabBar } from "./BottomTabBar";
import { DueReminderToasts } from "./DueReminderToasts";
import { Sidebar } from "./Sidebar";

// 100dvh grid. Mobile and tablet: page above the bottom tab bar. Desktop: sidebar beside the page.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-dvh grid-rows-[minmax(0,1fr)_auto] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] lg:grid-cols-[auto_minmax(0,1fr)] lg:grid-rows-1">
      <Sidebar />
      <div className="min-h-0 lg:pb-[env(safe-area-inset-bottom)]">{children}</div>
      <BottomTabBar />
      <DueReminderToasts />
      <PushSync />
    </div>
  );
}
