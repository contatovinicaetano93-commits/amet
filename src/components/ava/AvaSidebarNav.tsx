"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AvaNavItem } from "@/lib/ava/nav";

type AvaSidebarNavProps = {
  items: AvaNavItem[];
};

export function AvaSidebarNav({ items }: AvaSidebarNavProps) {
  const pathname = usePathname() || "/ava";

  return (
    <nav className="ava-side-nav" aria-label="Menu AVA">
      {items.map((item) => {
        const active = item.match
          ? item.match(pathname)
          : pathname === item.href.split("#")[0];
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={`ava-side-link ${active ? "is-active" : ""}`}
          >
            <span className="ava-side-dot" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
