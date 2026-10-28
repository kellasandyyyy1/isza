import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { privacyPolicy } from "@/content/legal";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Your data stays on this device. We never sell or share it.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return <LegalPage document={privacyPolicy} other={{ href: "/terms", label: "Read the terms" }} />;
}
