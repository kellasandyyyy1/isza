"use client";

import { IconBarbell } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import type { GuidanceKey } from "@/content/guidance";
import { getGuidance } from "@/lib/guidance";
import { PLAN_TOPICS, type PlanTopic } from "./todayConfig";

interface PlanSheetProps {
  topic: PlanTopic | null;
  guidanceKey: GuidanceKey;
  // Today's rotating line for the card, under its phase sentence.
  note: string | null;
  onClose: () => void;
}

export function PlanSheet({ topic, guidanceKey, note, onClose }: PlanSheetProps) {
  const router = useRouter();
  const entry = PLAN_TOPICS.find((item) => item.key === topic);

  return (
    <ResponsiveSheet
      open={topic !== null}
      onOpenChange={(open) => !open && onClose()}
      title={entry?.title ?? ""}
      footer={
        topic === "train" && (
          <Button fullWidth icon={IconBarbell} onClick={() => router.push("/train")}>
            Log workout
          </Button>
        )
      }
    >
      {topic && (
        <div className="flex flex-col gap-2">
          <p className="text-body text-ink">{getGuidance(guidanceKey, topic)}</p>
          {note && <p className="text-small text-ink-muted">{note}</p>}
        </div>
      )}
    </ResponsiveSheet>
  );
}
