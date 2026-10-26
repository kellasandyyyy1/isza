"use client";

import { IconPlus, IconShoppingBag } from "@tabler/icons-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { MascotPose } from "@/components/ui/MascotSlot";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { deleteSupply } from "@/db/repo";
import type { Supply } from "@/db/schema";
import { ConfirmDeleteView } from "./ConfirmDeleteView";
import { SupplyEditor } from "./SupplyEditor";
import { SupplyItem } from "./SupplyItem";

interface SuppliesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplies: Supply[];
  // The pose of the page the sheet opens from.
  pose: MascotPose;
}

type View = { name: "list" } | { name: "edit"; supply: Supply | null } | { name: "delete"; supply: Supply };

// Opened from Me, and from the "Running low" chip on Today.
export function SuppliesSheet({ open, onOpenChange, supplies, pose }: SuppliesSheetProps) {
  const headingId = useId();
  const [view, setView] = useState<View>({ name: "list" });
  const moved = useRef(false);

  useEffect(() => {
    if (moved.current && view.name !== "list") document.getElementById(headingId)?.focus();
  }, [view, headingId]);

  const goTo = (next: View) => {
    moved.current = true;
    setView(next);
  };
  const changeOpen = (next: boolean) => {
    if (!next) setView({ name: "list" });
    onOpenChange(next);
  };

  return (
    <ResponsiveSheet open={open} onOpenChange={changeOpen} title="Supplies">
      {view.name === "edit" ? (
        <SupplyEditor
          headingId={headingId}
          supply={view.supply}
          onDone={() => goTo({ name: "list" })}
          onDelete={() => view.supply && goTo({ name: "delete", supply: view.supply })}
        />
      ) : view.name === "delete" ? (
        <ConfirmDeleteView
          headingId={headingId}
          title="Delete this supply?"
          text={`This deletes "${view.supply.label}" and its count of ${view.supply.count}.`}
          confirmLabel="Delete supply"
          backLabel="Back to supply"
          onConfirm={async () => {
            if (view.supply.id !== undefined) await deleteSupply(view.supply.id);
            goTo({ name: "list" });
          }}
          onCancel={() => goTo({ name: "edit", supply: view.supply })}
        />
      ) : supplies.length === 0 ? (
        <EmptyState
          icon={IconShoppingBag}
          mascot={{ pose }}
          title="No supplies yet"
          text="Track pads, tampons or painkillers so you never run out."
          action={{ label: "Add supply", icon: IconPlus, onClick: () => goTo({ name: "edit", supply: null }) }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <ul aria-label="Your supplies" className="flex flex-col divide-y divide-line">
            {supplies.map((supply) => (
              <SupplyItem key={supply.id} supply={supply} onEdit={() => goTo({ name: "edit", supply })} />
            ))}
          </ul>
          <Button fullWidth variant="secondary" icon={IconPlus} onClick={() => goTo({ name: "edit", supply: null })}>
            Add supply
          </Button>
        </div>
      )}
    </ResponsiveSheet>
  );
}
