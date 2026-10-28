import Image from "next/image";
import { cx } from "@/lib/cx";
import type { IconTileSize } from "./IconTile";

// Built from assets/icons/ by scripts/build-art-icons.mjs.
export type ArtIconName = "period" | "sleep" | "food" | "train" | "social" | "energy" | "security" | "heart" | "blood";

export interface ArtIconProps {
  name: ArtIconName;
  size?: IconTileSize;
  className?: string;
}

// The same boxes as IconTile, so either one fits the same spot.
const SIZES: Record<IconTileSize, number> = { xs: 24, sm: 28, md: 36 };

// A 3D icon image. Decorative: always sits next to a text label.
export function ArtIcon({ name, size = "md", className }: ArtIconProps) {
  const px = SIZES[size];
  return (
    <Image
      src={`/art-icons/${name}-144.webp`}
      alt=""
      aria-hidden
      width={px}
      height={px}
      // Already optimized at build time; the 144px file covers every screen density.
      unoptimized
      draggable={false}
      className={cx("shrink-0 object-contain select-none", className)}
      style={{ filter: "var(--mascot-glow)" }}
    />
  );
}
