"use client";

import { IconDeviceMobile } from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import { IOS_INSTALL_HINT } from "@/lib/pwa";
import { IosInstallSteps } from "./IosInstallSteps";
import { promptInstall, useCanInstall } from "./installPrompt";
import { useIosHint } from "./useIosHint";

// The button shows only after the browser fired beforeinstallprompt. iOS gets the Share menu steps instead.
export function InstallApp() {
  const canInstall = useCanInstall();
  const iosHint = useIosHint();

  if (canInstall) {
    return (
      <Button variant="secondary" icon={IconDeviceMobile} onClick={() => void promptInstall()}>
        Install Iszacycle
      </Button>
    );
  }
  if (iosHint) return <IosInstallSteps intro={IOS_INSTALL_HINT} />;
  return null;
}
