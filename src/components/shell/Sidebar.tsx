"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";
import { isActiveRoute, navItems } from "./navItems";

// 1024px and up. 240px wide.
export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="hidden w-60 flex-col border-r border-line bg-surface pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] lg:flex"
    >
      <p className="px-7 pt-6 pb-8 text-h1 text-ink">iszacycle</p>
      <ul className="flex flex-col gap-1 px-4">
        {navItems.map(({ href, label, icon: ItemIcon }) => {
          const active = isActiveRoute(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex h-12 items-center gap-3 rounded-pill px-4 text-body-strong transition-colors",
                  active ? "bg-selected-bg font-semibold text-selected-ink" : "text-ink hover:bg-surface-2",
                )}
              >
                <ItemIcon size={20} stroke={1.75} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
