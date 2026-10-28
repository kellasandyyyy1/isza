import type { Metadata } from "next";
import { PageLayout } from "@/components/shell/PageLayout";
import { HelplineList } from "@/components/validation/HelplineList";

export const metadata: Metadata = {
  title: "Support",
};

// A plain static page. Nothing here depends on what she logs or writes.
export default function SupportPage() {
  return (
    <PageLayout title="Support">
      <HelplineList />
    </PageLayout>
  );
}
