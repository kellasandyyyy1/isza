import type { Metadata } from "next";
import { InsightsScreen } from "@/components/insights/InsightsScreen";
import { PageLayout } from "@/components/shell/PageLayout";

export const metadata: Metadata = {
  title: "Insights",
};

export default function InsightsPage() {
  return (
    <PageLayout title="Insights" fill>
      <InsightsScreen />
    </PageLayout>
  );
}
