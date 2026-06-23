"use client";

import { useState } from "react";

import { BrandLogo } from "@/components/BrandLogo";
import { navLinks } from "@/lib/content";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-amet-white/10 bg-amet-indigo/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <a href="#inicio">
          <BrandLogo
            markClassName="h-11 w-11 sm:h-12 sm:w-12"
            nameClassName="hidden text-sm font-semibold tracking-[0.08em] text-amet-blue sm:inline sm:text-base"
          />
        </a>

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-amet-white/70 transition hover:text-amet-blue"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#estagios"
          className="hidden rounded-full bg-amet-blue px-4 py-2 text-sm font-semibold text-amet-white transition hover:bg-amet-purple sm:inline-flex"
        >
          Candidatar-se
        </a>

        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg border border-amet-white/20 p-2 text-amet-white lg:hidden"
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
        </button>
      </div>

      {open && (
        <nav className="border-t border-amet-white/10 px-6 py-4 lg:hidden">
          <ul className="space-y-3">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block text-sm font-medium text-amet-white/80 hover:text-amet-blue"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a
                href="#estagios"
                onClick={() => setOpen(false)}
                className="inline-flex rounded-full bg-amet-blue px-4 py-2 text-sm font-semibold text-amet-white"
              >
                Candidatar-se
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
