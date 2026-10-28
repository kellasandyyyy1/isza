import type { Metadata } from "next";
import { MeScreen } from "@/components/me/MeScreen";
import { PageLayout } from "@/components/shell/PageLayout";

export const metadata: Metadata = {
  title: "Me",
};

// A short list; if it does not fit, it scrolls inside the page's one scroll area.
export default function MePage() {
  return (
    <PageLayout title="Me">
      <MeScreen />
    </PageLayout>
  );
}
