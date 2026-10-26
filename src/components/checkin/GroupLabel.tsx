// Visible label for a group of buttons. The group points at it with aria-labelledby.
export function GroupLabel({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className="mb-1.5 text-small text-ink-muted">
      {children}
    </p>
  );
}
