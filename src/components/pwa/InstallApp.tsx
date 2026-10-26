"use client";

import { IconDeviceMobile } from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import { IOS_INSTALL_HINT } from "@/lib/pwa";
import { promptInstall, useCanInstall } from "./installPrompt";
import { useIosHint } from "./useIosHint";

// The button shows only after the browser fired beforeinstallprompt. iOS gets a one-line hint instead.
export function InstallApp() {
  const canInstall = useCanInstall();
  const iosHint = useIosHint();

  if (canInstall) {
    return (
      <Button variant="secondary" icon={IconDeviceMobile} onClick={() => void promptInstall()}>
        Install Isza
      </Button>
    );
  }
  if (iosHint) return <p className="text-body text-ink">{IOS_INSTALL_HINT}</p>;
  return null;
}
