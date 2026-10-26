import type { ReactNode } from "react";

// Remounts on every navigation: a 150ms fade, skipped when reduced motion is set.
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <div className="h-full motion-safe:animate-page-in">{children}</div>;
}
