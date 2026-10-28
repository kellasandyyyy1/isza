"use client";

import { IconHeartHandshake } from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ValidationCard as ValidationCardData } from "@/lib/validation";

interface ValidationCardProps {
  card: ValidationCardData;
  onDismiss: () => void;
}

// A quiet supportive note. Never an alert: role "note", no accent color, and it never takes focus.
export function ValidationCard({ card, onDismiss }: ValidationCardProps) {
  const reduced = useReducedMotion() === true;
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* p-4! narrows the Card's own p-5 to 16px. */}
      <Card tone="surface-2" role="note" aria-label={card.title} className="flex flex-col gap-2 p-4!">
        <div className="flex items-start gap-3">
          <IconHeartHandshake size={20} stroke={1.75} aria-hidden className="mt-0.5 shrink-0 text-ink-muted" />
          <div className="min-w-0">
            <p className="text-body-strong text-ink">{card.title}</p>
            <p className="text-body text-ink">{card.body}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-11! self-end"
          onClick={(event) => {
            // Dismiss counts on its own; it is not a tap anywhere that just closes the sheet.
            event.stopPropagation();
            onDismiss();
          }}
        >
          Dismiss
        </Button>
      </Card>
    </motion.div>
  );
}
