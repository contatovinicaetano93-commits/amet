"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/BrandLogo";
import { smoothScrollTo } from "@/lib/lenis";
import { navLinks } from "@/lib/content";

function sectionIdFromHref(href: string) {
  return href.replace("/#", "");
}

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(sectionIdFromHref(navLinks[0].href));

  useEffect(() => {
    const ids = navLinks.map((link) => sectionIdFromHref(link.href));
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false);
    if (!isHome) return; // let the browser navigate to "/#section" normally
    event.preventDefault();
    smoothScrollTo(`#${sectionIdFromHref(href)}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-amet-blue/10 bg-amet-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-2">
        <a href="/#inicio" onClick={(event) => handleNavClick(event, "/#inicio")}>
          <BrandLogo
            markClassName="h-8 w-8 sm:h-9 sm:w-9"
            nameClassName="text-xs font-semibold tracking-[0.06em] text-amet-blue sm:text-sm"
          />
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const id = sectionIdFromHref(link.href);
            const isActive = id === activeId;

            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => handleNavClick(event, link.href)}
                className={`relative px-3 py-2 text-sm font-medium transition ${
                  isActive ? "text-amet-blue" : "text-amet-indigo/70 hover:text-amet-blue"
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-active-indicator"
                    className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-amet-blue"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg border border-amet-blue/15 p-2 text-amet-indigo lg:hidden"
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
        </button>
      </div>

      {open && (
        <nav className="border-t border-amet-blue/10 bg-amet-white px-6 py-4 lg:hidden">
          <ul className="space-y-3">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(event) => handleNavClick(event, link.href)}
                  className="block text-sm font-medium text-amet-indigo/80 hover:text-amet-blue"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
