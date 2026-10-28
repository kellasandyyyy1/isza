"use client";

import { IconAlertCircle, IconArrowLeft, IconMapQuestion } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";

const STATES = {
  "not-found": {
    icon: IconMapQuestion,
    title: "This page does not exist",
    text: "The link may be old or mistyped. Your data is safe.",
  },
  error: {
    icon: IconAlertCircle,
    title: "Something went wrong",
    text: "Your data is safe on this device. Going back to Today usually fixes it.",
  },
} as const;

// A centered empty state whose one button goes back to Today. Used by the not-found page and the error boundary.
export function BackToTodayState({ kind }: { kind: keyof typeof STATES }) {
  const router = useRouter();
  const { icon, title, text } = STATES[kind];
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center">
      <EmptyState
        icon={icon}
        title={title}
        text={text}
        action={{ label: "Back to Today", icon: IconArrowLeft, onClick: () => router.push("/today") }}
      />
    </main>
  );
}
