import { IconChevronLeft } from "@tabler/icons-react";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import type { LegalDocument } from "@/content/legal";
import { LEGAL_LAST_UPDATED } from "@/content/legal";
import { DraftNotice } from "./DraftNotice";

interface LegalPageProps {
  document: LegalDocument;
  // The other legal page, linked at the bottom.
  other: { href: "/privacy" | "/terms"; label: string };
}

// A plain reading page outside the app shell: a back link, the title, the date, then the sections. The page
// itself is the one scroll area.
export function LegalPage({ document, other }: LegalPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-[max(env(safe-area-inset-top),16px)] pb-10 sm:px-6">
      <Link
        href="/"
        aria-label="Back to Iszacycle"
        className="-ml-2 inline-flex size-11 items-center justify-center rounded-pill text-ink transition-colors hover:bg-surface-2"
      >
        <IconChevronLeft size={20} stroke={1.75} aria-hidden />
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-display text-ink">{document.title}</h1>
        <p className="text-small text-ink-muted">
          Last updated: <time dateTime={LEGAL_LAST_UPDATED}>{format(parseISO(LEGAL_LAST_UPDATED), "d MMMM yyyy")}</time>
        </p>
      </header>
      <DraftNotice />
      <p className="text-body-strong text-ink">{document.intro}</p>
      {document.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-2 rounded-card bg-surface p-5 shadow-card">
          <h2 className="text-h2 text-ink">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-body text-ink-muted">
              {paragraph}
            </p>
          ))}
          {section.list && (
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-body text-ink-muted marker:text-ink-muted">
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <Link href={other.href} className="self-start rounded-pill py-2.5 text-body-strong text-ink underline underline-offset-4">
        {other.label}
      </Link>
    </main>
  );
}
