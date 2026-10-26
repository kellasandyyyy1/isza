"use client";

import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { ThemePreference } from "@/lib/theme";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <SegmentedControl<ThemePreference>
      aria-label="Theme"
      value={theme}
      onValueChange={setTheme}
      options={[
        { value: "system", label: "System", icon: IconDeviceDesktop },
        { value: "light", label: "Light", icon: IconSun },
        { value: "dark", label: "Dark", icon: IconMoon },
      ]}
    />
  );
}
