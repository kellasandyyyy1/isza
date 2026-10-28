import { IconSquarePlus, IconUpload, type Icon } from "@tabler/icons-react";
import { cx } from "@/lib/cx";

interface Step {
  before: string;
  // The button's name in iOS, shown with the icon iOS uses for it, kept on one line so they never split.
  button?: { name: string; icon: Icon };
  after?: string;
}

const STEPS: Step[] = [
  { before: "Open this page in Safari." },
  { before: "Tap ", button: { name: "Share", icon: IconUpload }, after: " at the bottom of the screen. On iPad it is at the top." },
  { before: "Scroll down and tap ", button: { name: "Add to Home Screen", icon: IconSquarePlus }, after: "." },
  { before: "Tap Add, then open Iszacycle from your Home Screen." },
];

interface IosInstallStepsProps {
  // Why she is seeing this, shown above the steps.
  intro: string;
  className?: string;
}

// iOS has no install button: the app goes on the Home Screen from the Share menu. Shown only on iPhone and iPad
// outside the Home Screen app (see useIosHint). Numbered steps, each with the icon iOS uses for it.
export function IosInstallSteps({ intro, className }: IosInstallStepsProps) {
  return (
    <div className={cx("flex flex-col gap-3 rounded-input bg-surface-2 p-4", className)}>
      <p className="text-body-strong text-ink">{intro}</p>
      <ol className="flex flex-col gap-2.5">
        {STEPS.map(({ before, button, after }, index) => (
          <li key={before} className="flex items-start gap-3 text-small text-ink">
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-pill bg-surface text-caption font-semibold text-ink"
            >
              {index + 1}
            </span>
            <span className="flex-1 pt-0.5">
              {before}
              {button && (
                <span className="whitespace-nowrap font-semibold">
                  {button.name}
                  <button.icon size={18} stroke={1.75} aria-hidden className="ml-1 inline-block align-text-bottom text-primary" />
                </span>
              )}
              {after}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-small text-ink-muted">Notifications need iOS 16.4 or later, and work from the Home Screen app.</p>
    </div>
  );
}
