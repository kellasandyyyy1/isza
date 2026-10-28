import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { termsOfUse } from "@/content/legal";

export const metadata: Metadata = {
  title: "Terms",
  description: "Iszacycle is not a medical device or a contraceptive.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return <LegalPage document={termsOfUse} other={{ href: "/privacy", label: "Read the privacy policy" }} />;
}
