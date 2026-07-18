"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { matchNavPath, type AvaNavItem } from "@/lib/ava/nav";

type AvaSidebarNavProps = {
  items: AvaNavItem[];
};

function hrefHash(href: string): string {
  return href.includes("#") ? `#${href.split("#")[1]}` : "";
}

function isItemActive(
  item: AvaNavItem,
  pathname: string,
  hash: string,
): boolean {
  const itemHash = hrefHash(item.href);
  if (itemHash) {
    return pathname === item.href.split("#")[0] && hash === itemHash;
  }

  if (!matchNavPath(pathname, item.match, item.href)) {
    return false;
  }

  // On admin home, a section hash belongs to another tab.
  if (pathname === "/ava/admin" && hash) {
    return false;
  }

  return true;
}

export function AvaSidebarNav({ items }: AvaSidebarNavProps) {
  const pathname = usePathname() || "/ava";
  const [hash, setHash] = useState("");

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash || "");
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  return (
    <nav className="ava-side-nav" aria-label="Menu AVA">
      {items.map((item) => {
        const active = isItemActive(item, pathname, hash);
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={`ava-side-link ${active ? "is-active" : ""}`}
            onClick={() => setHash(hrefHash(item.href))}
          >
            <span className="ava-side-dot" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
