"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { IconX } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { Drawer } from "vaul";
import { IconButton } from "./IconButton";
import { useIsDesktop } from "./useIsDesktop";

export interface ResponsiveSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

// Bottom sheet (vaul) under 1024px, side panel (Radix Dialog) at 1024px and up.
export function ResponsiveSheet({ open, onOpenChange, title, description, children, footer }: ResponsiveSheetProps) {
  const isDesktop = useIsDesktop();
  const describedBy = description ? {} : { "aria-describedby": undefined };

  if (isDesktop) {
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim motion-safe:data-[state=closed]:animate-fade-out motion-safe:data-[state=open]:animate-fade-in" />
          <Dialog.Content
            {...describedBy}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-edge bg-surface text-ink shadow-raised outline-none motion-safe:data-[state=closed]:animate-panel-out motion-safe:data-[state=open]:animate-panel-in"
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
              <div>
                <Dialog.Title className="text-h1">{title}</Dialog.Title>
                {description && (
                  <Dialog.Description className="mt-1 text-body text-ink-muted">{description}</Dialog.Description>
                )}
              </div>
              <Dialog.Close asChild>
                <IconButton icon={IconX} aria-label="Close" className="-mt-2 -mr-2" />
              </Dialog.Close>
            </div>
            <div data-sheet-body className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
            {footer && <div className="px-6 pb-6">{footer}</div>}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-scrim" />
        <Drawer.Content
          {...describedBy}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-sheet border-t border-edge bg-surface pb-[env(safe-area-inset-bottom)] text-ink shadow-raised outline-none"
        >
          <div aria-hidden className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-pill bg-ink-muted" />
          <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
            <div>
              <Drawer.Title className="text-h1">{title}</Drawer.Title>
              {description && (
                <Drawer.Description className="mt-1 text-body text-ink-muted">{description}</Drawer.Description>
              )}
            </div>
            <Drawer.Close asChild>
              <IconButton icon={IconX} aria-label="Close" className="-mt-2 -mr-2" />
            </Drawer.Close>
          </div>
          <div data-sheet-body className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
          {footer && <div className="px-5 pb-5">{footer}</div>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
