import type { Metadata } from "next";
import { CalendarScreen } from "@/components/calendar/CalendarScreen";
import { PageLayout } from "@/components/shell/PageLayout";

export const metadata: Metadata = {
  title: "Calendar",
};

export default function CalendarPage() {
  return (
    <PageLayout title="Calendar" fill>
      <CalendarScreen />
    </PageLayout>
  );
}
