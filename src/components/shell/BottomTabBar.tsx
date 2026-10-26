"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";
import { isActiveRoute, navItems } from "./navItems";

// Under 1024px. 64px tall plus the bottom safe-area inset.
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="grid h-16 grid-cols-5">
        {navItems.map(({ href, label, icon: ItemIcon }) => {
          const active = isActiveRoute(pathname, href);
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-input text-caption",
                  active ? "font-semibold text-ink" : "text-ink-muted",
                )}
              >
                <span
                  className={cx(
                    "flex h-8 w-14 items-center justify-center rounded-pill transition-colors",
                    active && "bg-selected-bg text-selected-ink",
                  )}
                >
                  <ItemIcon size={24} stroke={1.75} aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
