import {
  IconBarbell,
  IconBed,
  IconBolt,
  IconDroplet,
  IconLeaf,
  IconMoon,
  IconPlant2,
  IconSalad,
  IconSparkles,
  IconUsers,
  IconZzz,
  type Icon,
} from "@tabler/icons-react";
import type { GuidanceEntry } from "@/content/guidance";
import type { ArtIconName } from "@/components/ui/ArtIcon";
import type { IconTileTone } from "@/components/ui/IconTile";
import type { ProgressRingColor } from "@/components/ui/ProgressRing";
import type { Phase } from "@/lib/cycle";
import type { ReadinessBand } from "@/lib/readiness";

export type PlanTopic = keyof GuidanceEntry;

// Each topic has its own tile color, so the carousel reads at a glance. A topic with art shows the 3D image instead.
// Water is the sixth card, with the water mascot, built in components/water.
export const PLAN_TOPICS: { key: PlanTopic; title: string; icon: Icon; tone: IconTileTone; art?: ArtIconName }[] = [
  { key: "train", title: "Train", icon: IconBarbell, tone: "success", art: "train" },
  { key: "food", title: "Food", icon: IconSalad, tone: "follicular", art: "food" },
  { key: "energy", title: "Energy", icon: IconBolt, tone: "ovulatory", art: "energy" },
  { key: "sleep", title: "Sleep", icon: IconBed, tone: "luteal", art: "sleep" },
  { key: "social", title: "Social", icon: IconUsers, tone: "warning", art: "social" },
];

export const PHASE_ICONS: Record<Phase, Icon> = {
  menstrual: IconDroplet,
  follicular: IconPlant2,
  ovulatory: IconSparkles,
  luteal: IconMoon,
};

export const PHASE_NAMES: Record<Phase, string> = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulatory: "Ovulatory",
  luteal: "Luteal",
};

// The readiness band's icon, ring color and tile color. The band name is always shown too, so color is never the only signal.
export const BAND_STYLES: Record<ReadinessBand, { icon: Icon; ring: ProgressRingColor; tone: IconTileTone }> = {
  Go: { icon: IconBolt, ring: "success", tone: "success" },
  Steady: { icon: IconLeaf, ring: "warning", tone: "warning" },
  Rest: { icon: IconZzz, ring: "luteal", tone: "luteal" },
};
