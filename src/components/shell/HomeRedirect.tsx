"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProfile } from "@/db/hooks";
import { homeRouteFor } from "@/lib/onboarding";

// The profile lives on the device, so the redirect happens in the browser.
export function HomeRedirect() {
  const router = useRouter();
  const profile = useProfile();

  useEffect(() => {
    if (profile === undefined) return;
    router.replace(homeRouteFor(profile?.onboardingComplete ?? false));
  }, [profile, router]);

  return <main aria-busy="true" className="h-dvh" />;
}
