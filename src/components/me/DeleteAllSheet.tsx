"use client";

import { useRouter } from "next/navigation";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { DeleteAllForm } from "./DeleteAllForm";

export function DeleteAllSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Delete all data">
      <DeleteAllForm
        onDeleted={() => {
          onOpenChange(false);
          router.replace("/onboarding");
        }}
      />
    </ResponsiveSheet>
  );
}
