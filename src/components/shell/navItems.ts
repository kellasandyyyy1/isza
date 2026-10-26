import { IconBarbell, IconCalendar, IconChartLine, IconSun, IconUser, type Icon } from "@tabler/icons-react";

export interface NavItem {
  href: "/today" | "/calendar" | "/train" | "/insights" | "/me";
  label: string;
  icon: Icon;
}

export const navItems: NavItem[] = [
  { href: "/today", label: "Today", icon: IconSun },
  { href: "/calendar", label: "Calendar", icon: IconCalendar },
  { href: "/train", label: "Train", icon: IconBarbell },
  { href: "/insights", label: "Insights", icon: IconChartLine },
  { href: "/me", label: "Me", icon: IconUser },
];

export function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
