import type { Metadata } from "next";
import { PageLayout } from "@/components/shell/PageLayout";
import { TrainScreen } from "@/components/train/TrainScreen";

export const metadata: Metadata = {
  title: "Train",
};

export default function TrainPage() {
  return (
    <PageLayout title="Train" fill>
      <TrainScreen />
    </PageLayout>
  );
}
