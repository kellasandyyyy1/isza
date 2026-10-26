"use client";

import { IconBarbell } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { guidance, type GuidanceKey } from "@/content/guidance";
import { PLAN_TOPICS, type PlanTopic } from "./todayConfig";

interface PlanSheetProps {
  topic: PlanTopic | null;
  guidanceKey: GuidanceKey;
  onClose: () => void;
}

export function PlanSheet({ topic, guidanceKey, onClose }: PlanSheetProps) {
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
      {topic && <p className="text-body text-ink">{guidance[guidanceKey][topic]}</p>}
    </ResponsiveSheet>
  );
}
