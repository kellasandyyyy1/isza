import type { Icon } from "@tabler/icons-react";
import type { CSSProperties } from "react";
import { cx } from "@/lib/cx";

export type IconTileTone = "period" | "menstrual" | "follicular" | "ovulatory" | "luteal" | "success" | "warning";
export type IconTileSize = "xs" | "sm" | "md";

export interface IconTileProps {
  icon: Icon;
  tone: IconTileTone;
  size?: IconTileSize;
  className?: string;
}

const TONE_VARS: Record<IconTileTone, string> = {
  period: "var(--period)",
  menstrual: "var(--phase-menstrual)",
  follicular: "var(--phase-follicular)",
  ovulatory: "var(--phase-ovulatory)",
  luteal: "var(--phase-luteal)",
  success: "var(--success)",
  warning: "var(--warning)",
};

const SIZES: Record<IconTileSize, { box: string; icon: number }> = {
  xs: { box: "size-6", icon: 14 },
  sm: { box: "size-7", icon: 16 },
  md: { box: "size-9", icon: 20 },
};

// A Tabler icon on a glossy 3D tile. Decorative: always sits next to a text label.
export function IconTile({ icon: TileIcon, tone, size = "md", className }: IconTileProps) {
  const style = { "--tile": TONE_VARS[tone] } as CSSProperties;
  return (
    <span aria-hidden="true" className={cx("icon-tile", SIZES[size].box, className)} style={style}>
      <TileIcon size={SIZES[size].icon} stroke={2} />
    </span>
  );
}
