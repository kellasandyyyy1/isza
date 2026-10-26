import Link from "next/link";
import { InstallApp } from "@/components/pwa/InstallApp";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";

const linkClasses = "inline-flex min-h-11 items-center text-body-strong text-primary underline underline-offset-4";

export function AboutSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="About Isza">
      <div className="flex flex-col gap-3">
        <p className="text-body text-ink">Version {process.env.NEXT_PUBLIC_APP_VERSION}</p>
        <p className="text-body text-ink">Isza is not a medical device or a contraceptive.</p>
        <p className="text-body text-ink-muted">Your data stays on this device. We never sell or share it.</p>
        <InstallApp />
        <div className="flex gap-6">
          <Link href="/privacy" className={linkClasses}>
            Privacy
          </Link>
          <Link href="/terms" className={linkClasses}>
            Terms
          </Link>
        </div>
      </div>
    </ResponsiveSheet>
  );
}
