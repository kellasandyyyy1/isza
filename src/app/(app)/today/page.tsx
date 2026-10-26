import type { Metadata } from "next";
import { PageLayout } from "@/components/shell/PageLayout";
import { TodayScreen } from "@/components/today/TodayScreen";

export const metadata: Metadata = {
  title: "Today",
};

export default function TodayPage() {
  return (
    <PageLayout title="Today" showTitle={false} fill>
      <TodayScreen />
    </PageLayout>
  );
}
