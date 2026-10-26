"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Toast } from "@/components/ui/Toast";
import { ComponentGallery } from "./ComponentGallery";
import { LoadDemoDataButton } from "./LoadDemoDataButton";
import { SendTestPushButton } from "./SendTestPushButton";
import { ShowcaseSection } from "./ShowcaseSection";

export function UiShowcase() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <main className="mx-auto flex w-full max-w-content flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4">
        <h1 className="text-display">UI kit</h1>
        <ThemeToggle />
      </header>

      <ShowcaseSection title="ResponsiveSheet and Toast (current theme)">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setSheetOpen(true)}>Open sheet</Button>
          <Button variant="secondary" onClick={() => setToast("Check-in saved")}>
            Show toast
          </Button>
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="Demo data (development only)">
        <div>
          <LoadDemoDataButton onLoaded={() => setToast("Demo data loaded")} />
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="Web Push (development only)">
        <div>
          <SendTestPushButton onResult={setToast} />
        </div>
      </ShowcaseSection>

      <div className="grid gap-6 lg:grid-cols-2">
        {(["light", "dark"] as const).map((mode) => (
          <div key={mode} data-theme={mode} className="rounded-card bg-bg p-4 text-ink sm:p-6">
            <h2 className="mb-6 text-h1 capitalize">{mode}</h2>
            <ComponentGallery />
          </div>
        ))}
      </div>

      <ResponsiveSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Sheet title"
        description="Bottom sheet on mobile, side panel on desktop."
        footer={
          <Button fullWidth onClick={() => setSheetOpen(false)}>
            Done
          </Button>
        }
      >
        <p className="text-body">Details open here, never on a new page.</p>
      </ResponsiveSheet>

      <Toast message={toast ?? ""} open={toast !== null} onOpenChange={(open) => !open && setToast(null)} />
    </main>
  );
}
