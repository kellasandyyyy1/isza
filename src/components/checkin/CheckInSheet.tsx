"use client";

import { format, parseISO } from "date-fns";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { useLog, usePeriods } from "@/db/hooks";
import { CheckInForm } from "./CheckInForm";

interface CheckInSheetProps {
  // "yyyy-MM-dd". Today from the Today screen, any past date from the Calendar later.
  date: string;
  today: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  // "symptoms" is the symptom shortcut on Today: only the symptoms, under its own title.
  startView?: "main" | "symptoms";
}

export function CheckInSheet({ date, today, open, onOpenChange, onSaved, startView = "main" }: CheckInSheetProps) {
  const log = useLog(date);
  const periods = usePeriods();
  const title =
    startView === "symptoms"
      ? "Log a symptom"
      : date === today
        ? "Today's check-in"
        : `Check-in for ${format(parseISO(date), "EEE, MMM d")}`;

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title={title}>
      {log === undefined || periods === undefined ? (
        <div aria-busy="true" className="h-40" />
      ) : (
        // Remounts on every open, so the form always starts from the saved log.
        <CheckInForm
          key={`${date}-${startView}`}
          date={date}
          today={today}
          log={log}
          periods={periods}
          onSaved={onSaved}
          startView={startView}
        />
      )}
    </ResponsiveSheet>
  );
}
