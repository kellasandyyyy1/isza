import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface PageLayoutProps {
  title: string;
  action?: ReactNode;
  // Under 1024px the content takes exactly the space between the header and the tab bar.
  fill?: boolean;
  // False on Today, where the greeting is the page heading. The title still names the page in metadata.
  showTitle?: boolean;
  children: ReactNode;
}

// At least 56px header with the title and one optional action, then the page's single scroll area.
export function PageLayout({ title, action, fill = false, showTitle = true, children }: PageLayoutProps) {
  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)]">
      <header className="pt-[env(safe-area-inset-top)]">
        {showTitle ? (
          <div className="mx-auto flex min-h-14 w-full max-w-content items-center justify-between gap-4 px-4 sm:px-6">
            <h1 className="truncate text-h1 text-ink">{title}</h1>
            {action}
          </div>
        ) : (
          <div className="h-4" />
        )}
      </header>
      <div data-page-scroll className="overflow-y-auto">
        <div
          className={cx(
            "mx-auto w-full max-w-content px-4 pb-4 sm:px-6",
            fill && "flex h-full flex-col lg:block lg:h-auto",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
