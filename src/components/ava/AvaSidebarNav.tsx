"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { matchNavPath, type AvaNavItem } from "@/lib/ava/nav";

type AvaSidebarNavProps = {
  items: AvaNavItem[];
};

export function AvaSidebarNav({ items }: AvaSidebarNavProps) {
  const pathname = usePathname() || "/ava";

  return (
    <nav className="ava-side-nav" aria-label="Menu AVA">
      {items.map((item) => {
        const active = matchNavPath(pathname, item.match, item.href);
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
