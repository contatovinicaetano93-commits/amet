"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  const router = useRouter();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash || "");
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  const activeHref = useMemo(() => {
    const active = items.find((item) => isItemActive(item, pathname, hash));
    return active?.href ?? items[0]?.href ?? "";
  }, [hash, items, pathname]);

  return (
    <div className="ava-side-nav-wrap">
      <label className="ava-nav-select-wrap">
        <span className="ava-nav-select-label">Navegar</span>
        <select
          className="ava-nav-select"
          value={activeHref}
          aria-label="Navegar entre as abas"
          onChange={(event) => {
            const href = event.target.value;
            if (!href) return;
            router.push(href);
            const nextHash = hrefHash(href);
            if (nextHash) {
              const id = href.split("#")[1] ?? "";
              window.setTimeout(() => {
                document
                  .getElementById(id)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
                setHash(nextHash);
              }, 0);
            } else {
              setHash("");
            }
          }}
        >
          {items.map((item) => (
            <option key={`${item.href}-${item.label}`} value={item.href}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

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
    </div>
  );
}
