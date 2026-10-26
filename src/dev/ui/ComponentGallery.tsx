"use client";

import {
  IconBarbell,
  IconCalendar,
  IconHeart,
  IconInbox,
  IconMoon,
  IconPlus,
  IconSettings,
} from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, type CardTone } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { MascotSlot } from "@/components/ui/MascotSlot";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Slider } from "@/components/ui/Slider";
import { StepDots } from "@/components/ui/StepDots";
import { Switch } from "@/components/ui/Switch";
import { ShowcaseSection } from "./ShowcaseSection";

const tones: CardTone[] = ["menstrual", "follicular", "ovulatory", "luteal"];

export function ComponentGallery() {
  const [chips, setChips] = useState<Record<string, boolean>>({ Training: true, Sleep: false, Mood: false });
  const [range, setRange] = useState<"week" | "month">("week");
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [focus, setFocus] = useState<"train" | "food" | "work" | "rest">("train");
  const [reminders, setReminders] = useState(true);
  const [haptics, setHaptics] = useState(false);
  const [energy, setEnergy] = useState(6);

  return (
    <div className="flex flex-col gap-8">
      <ShowcaseSection title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Primary sm</Button>
          <Button size="sm" variant="secondary">
            Secondary sm
          </Button>
          <Button size="sm" variant="ghost">
            Ghost sm
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button icon={IconPlus}>With icon</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
        </div>
        <Button fullWidth icon={IconCalendar}>
          Full width
        </Button>
      </ShowcaseSection>

      <ShowcaseSection title="IconButton">
        <div className="flex items-center gap-2">
          <IconButton icon={IconSettings} aria-label="Settings" />
          <IconButton icon={IconHeart} aria-label="Favorite" />
          <IconButton icon={IconMoon} aria-label="Disabled example" disabled />
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="Card">
        <Card>
          <p className="text-body-strong">Default card</p>
          <p className="text-body text-ink-muted">Surface with a soft shadow.</p>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          {tones.map((tone) => (
            <Card key={tone} tone={tone}>
              <p className="text-body-strong capitalize">{tone}</p>
              <p className="text-small text-ink-muted">Phase tint</p>
            </Card>
          ))}
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="Chip">
        <div className="flex flex-wrap gap-2">
          {Object.entries(chips).map(([label, selected]) => (
            <Chip
              key={label}
              selected={selected}
              icon={label === "Training" ? IconBarbell : undefined}
              onClick={() => setChips((current) => ({ ...current, [label]: !current[label] }))}
            >
              {label}
            </Chip>
          ))}
          <Chip disabled>Disabled</Chip>
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="SegmentedControl">
        <SegmentedControl
          aria-label="Range"
          value={range}
          onValueChange={setRange}
          options={[
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
          ]}
        />
        <SegmentedControl
          aria-label="View"
          value={view}
          onValueChange={setView}
          options={[
            { value: "day", label: "Day", panel: <p className="text-body text-ink-muted">Day panel</p> },
            { value: "week", label: "Week", panel: <p className="text-body text-ink-muted">Week panel</p> },
            { value: "month", label: "Month", panel: <p className="text-body text-ink-muted">Month panel</p> },
          ]}
        />
        <SegmentedControl
          aria-label="Focus"
          value={focus}
          onValueChange={setFocus}
          options={[
            { value: "train", label: "Train" },
            { value: "food", label: "Food" },
            { value: "work", label: "Work" },
            { value: "rest", label: "Rest" },
          ]}
        />
      </ShowcaseSection>

      <ShowcaseSection title="Switch">
        <Switch label="Daily reminder" description="A gentle nudge at 8:00." checked={reminders} onCheckedChange={setReminders} />
        <Switch label="Haptics" checked={haptics} onCheckedChange={setHaptics} />
        <Switch label="Disabled" checked={false} onCheckedChange={() => {}} disabled />
      </ShowcaseSection>

      <ShowcaseSection title="Slider">
        <Slider label="Energy" value={energy} onValueChange={setEnergy} min={1} max={10} formatValue={(value) => `${value} of 10`} />
      </ShowcaseSection>

      <ShowcaseSection title="ProgressRing">
        <div className="flex flex-wrap items-center gap-4">
          <ProgressRing value={72} label="Readiness 72 of 100">
            <span>
              <span className="block text-display">72</span>
              <span className="block text-caption text-ink-muted">Readiness</span>
            </span>
          </ProgressRing>
          <ProgressRing value={25} size={64} strokeWidth={8} color="menstrual" label="Menstrual 25%" />
          <ProgressRing value={50} size={64} strokeWidth={8} color="follicular" label="Follicular 50%" />
          <ProgressRing value={75} size={64} strokeWidth={8} color="ovulatory" label="Ovulatory 75%" />
          <ProgressRing value={100} size={64} strokeWidth={8} color="luteal" label="Luteal 100%" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ProgressRing value={90} size={48} strokeWidth={6} color="success" label="Success 90%" />
          <ProgressRing value={60} size={48} strokeWidth={6} color="warning" label="Warning 60%" />
          <ProgressRing value={30} size={48} strokeWidth={6} color="danger" label="Danger 30%" />
          <ProgressRing value={0} size={48} strokeWidth={6} label="Empty 0%" />
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="StepDots">
        <StepDots total={5} step={1} />
        <StepDots total={5} step={3} />
        <StepDots total={5} step={5} />
      </ShowcaseSection>

      <ShowcaseSection title="EmptyState">
        <Card>
          <EmptyState
            icon={IconInbox}
            title="No check-ins yet"
            text="Log your first check-in to start seeing patterns."
            action={{ label: "Log check-in", icon: IconPlus, onClick: () => {} }}
          />
          <EmptyState icon={IconInbox} title="Nothing here yet" text="Placeholder without an action." />
        </Card>
      </ShowcaseSection>

      <ShowcaseSection title="MascotSlot">
        <div className="flex flex-wrap items-end gap-3">
          {(["today", "checkin", "calendar", "train", "insights", "me"] as const).map((pose, index) => (
            <MascotSlot
              key={pose}
              pose={pose}
              size="sm"
              motion={(["idle", "cheer", "calm", "tired", "none", "idle"] as const)[index]}
              phase={(["menstrual", "follicular", "ovulatory", "luteal", null, null] as const)[index]}
            />
          ))}
        </div>
        <p className="text-small text-ink-muted">All six poses. The second one cheers once on load.</p>
      </ShowcaseSection>
    </div>
  );
}
