"use client";

import { useId, useState } from "react";
import { GroupLabel } from "@/components/checkin/GroupLabel";
import { ViewHeader } from "@/components/checkin/ViewHeader";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { addSupply, updateSupply } from "@/db/repo";
import { supplySchema, type Supply } from "@/db/schema";
import { SUPPLY_KIND_LABELS, type SupplyKind } from "@/lib/supplies";
import { CountStepper } from "./CountStepper";

interface SupplyEditorProps {
  headingId: string;
  supply: Supply | null;
  onDone: () => void;
  onDelete: () => void;
}

const KINDS = Object.entries(SUPPLY_KIND_LABELS) as [SupplyKind, string][];
const DEFAULT_LOW_AT = 4;

export function SupplyEditor({ headingId, supply, onDone, onDelete }: SupplyEditorProps) {
  const ids = { kind: useId(), label: useId() };
  const [kind, setKind] = useState<SupplyKind>(supply?.kind ?? "pads");
  const [label, setLabel] = useState(supply?.label ?? SUPPLY_KIND_LABELS.pads);
  const [count, setCount] = useState(supply?.count ?? 10);
  const [lowAt, setLowAt] = useState(supply?.lowAt ?? DEFAULT_LOW_AT);
  const [saving, setSaving] = useState(false);
  const parsed = supplySchema.omit({ id: true }).safeParse({ kind, label: label.trim(), count, lowAt });

  function changeKind(next: SupplyKind) {
    // Keep a name the user typed; replace one that was only the kind's default.
    if (label === SUPPLY_KIND_LABELS[kind]) setLabel(SUPPLY_KIND_LABELS[next]);
    setKind(next);
  }

  async function save() {
    if (!parsed.success) return;
    setSaving(true);
    try {
      if (supply?.id !== undefined) await updateSupply(supply.id, parsed.data);
      else await addSupply(parsed.data);
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ViewHeader id={headingId} title={supply ? "Edit supply" : "New supply"} onBack={onDone} backLabel="Back to supplies" />
      <div>
        <GroupLabel id={ids.kind}>Kind</GroupLabel>
        <div role="group" aria-labelledby={ids.kind} className="grid grid-cols-3 gap-2">
          {KINDS.map(([value, kindLabel]) => (
            <Chip key={value} size="compact" selected={kind === value} onClick={() => changeKind(value)}>
              {kindLabel}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor={ids.label} className="mb-1.5 block text-small text-ink-muted">
          Name
        </label>
        <input
          id={ids.label}
          type="text"
          maxLength={60}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          className="h-12 w-full rounded-input bg-surface-2 px-4 text-body text-ink"
        />
      </div>
      <CountStepper label="How many you have" value={count} onChange={setCount} />
      <CountStepper label="Low at" value={lowAt} onChange={setLowAt} />
      {!parsed.success && (
        <p role="alert" className="text-small text-danger">
          Give this supply a name.
        </p>
      )}
      <Button fullWidth disabled={!parsed.success} loading={saving} onClick={() => void save()}>
        Save supply
      </Button>
      {supply && (
        <Button fullWidth variant="ghost" disabled={saving} onClick={onDelete}>
          Delete supply
        </Button>
      )}
    </div>
  );
}
