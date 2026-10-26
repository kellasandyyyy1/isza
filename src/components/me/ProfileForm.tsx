"use client";

import { useId, useState } from "react";
import { GroupLabel } from "@/components/checkin/GroupLabel";
import { LengthStepper } from "@/components/onboarding/LengthStepper";
import { ACTIVITY_OPTIONS, CONTRACEPTION_OPTIONS, GOAL_OPTIONS, toggleGoal } from "@/components/onboarding/onboardingOptions";
import { RadioCardGroup } from "@/components/onboarding/RadioCardGroup";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { saveProfile } from "@/db/repo";
import type { Profile } from "@/db/schema";
import { clamp } from "@/lib/clamp";
import { CYCLE_LENGTH_RANGE, PERIOD_LENGTH_RANGE } from "@/lib/onboarding";

// Same inputs as onboarding. Unknown lengths start on the onboarding default with "Not sure" on.
function initialLength(value: number | null, range: { min: number; max: number; initial: number }) {
  return { value: value === null ? range.initial : clamp(value, range.min, range.max), unsure: value === null };
}

export function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const ids = { name: useId(), cycle: useId(), period: useId(), contraception: useId(), activity: useId(), goals: useId() };
  const [name, setName] = useState(profile.name ?? "");
  const [cycle, setCycle] = useState(() => initialLength(profile.typicalCycleLength, CYCLE_LENGTH_RANGE));
  const [period, setPeriod] = useState(() => initialLength(profile.typicalPeriodLength, PERIOD_LENGTH_RANGE));
  const [contraception, setContraception] = useState(profile.contraception);
  const [activityLevel, setActivityLevel] = useState(profile.activityLevel);
  const [goals, setGoals] = useState(profile.goals);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await saveProfile({
        ...profile,
        name: name.trim() === "" ? null : name.trim(),
        typicalCycleLength: cycle.unsure ? null : cycle.value,
        typicalPeriodLength: period.unsure ? null : period.value,
        contraception,
        activityLevel,
        goals,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const lengthField = (
    id: string,
    label: string,
    state: { value: number; unsure: boolean },
    setState: (next: { value: number; unsure: boolean }) => void,
    range: { min: number; max: number },
  ) => (
    <div>
      <GroupLabel id={id}>{label}</GroupLabel>
      <div className="flex items-center justify-between gap-3">
        <LengthStepper
          value={state.value}
          min={range.min}
          max={range.max}
          disabled={state.unsure}
          labelledBy={id}
          onChange={(value) => setState({ value, unsure: false })}
        />
        <Chip selected={state.unsure} onClick={() => setState({ ...state, unsure: !state.unsure })}>
          Not sure
        </Chip>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label htmlFor={ids.name} className="mb-1.5 block text-small text-ink-muted">
          Name (optional)
        </label>
        <input
          id={ids.name}
          type="text"
          maxLength={60}
          autoComplete="given-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-12 w-full rounded-input bg-surface-2 px-4 text-body text-ink"
        />
      </div>
      {lengthField(ids.cycle, "Usual cycle length", cycle, setCycle, CYCLE_LENGTH_RANGE)}
      {lengthField(ids.period, "Usual period length", period, setPeriod, PERIOD_LENGTH_RANGE)}
      <div>
        <GroupLabel id={ids.contraception}>Contraception</GroupLabel>
        <RadioCardGroup
          name="profile-contraception"
          labelledBy={ids.contraception}
          options={CONTRACEPTION_OPTIONS}
          value={contraception}
          onChange={setContraception}
        />
      </div>
      <div>
        <GroupLabel id={ids.activity}>Activity</GroupLabel>
        <RadioCardGroup
          name="profile-activity"
          labelledBy={ids.activity}
          options={ACTIVITY_OPTIONS}
          value={activityLevel}
          onChange={setActivityLevel}
        />
      </div>
      <div>
        <GroupLabel id={ids.goals}>Goals (at least one)</GroupLabel>
        <div role="group" aria-labelledby={ids.goals} className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map(({ value, label, icon }) => (
            <Chip key={value} icon={icon} selected={goals.includes(value)} onClick={() => setGoals(toggleGoal(goals, value))}>
              {label}
            </Chip>
          ))}
        </div>
      </div>
      <Button fullWidth disabled={goals.length === 0} loading={saving} onClick={() => void save()}>
        Save profile
      </Button>
    </div>
  );
}
