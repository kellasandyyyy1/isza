import Link from "next/link";

// Always present, never triggered by anything she writes. Opens the plain /support page.
export function SupportLine() {
  return (
    <p className="text-center text-small text-ink-muted">
      <Link href="/support" className="inline-flex min-h-11 items-center underline underline-offset-2">
        If you are struggling, support is available.
      </Link>
    </p>
  );
}
