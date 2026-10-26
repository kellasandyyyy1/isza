import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = {
  title: "Welcome",
};

// Full screen, no navigation.
export default function OnboardingPage() {
  return <OnboardingFlow />;
}
