"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import { heroCarouselImages } from "@/lib/content";

export function GalleryLightbox() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openIndex === null) return;

    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (overlay && panel) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set([overlay, panel], { opacity: 1, scale: 1 });
      } else {
        gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" });
        gsap.fromTo(panel, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out" });
      }
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenIndex(null);
      if (event.key === "ArrowRight") setOpenIndex((current) => (current === null ? current : (current + 1) % heroCarouselImages.length));
      if (event.key === "ArrowLeft") setOpenIndex((current) => (current === null ? current : (current - 1 + heroCarouselImages.length) % heroCarouselImages.length));
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [openIndex]);

  return (
    <>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {heroCarouselImages.map((photo, index) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group relative aspect-[4/3] w-56 shrink-0 snap-center overflow-hidden rounded-lg border border-amet-indigo/10 sm:w-64"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt={photo.alt}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <span className="absolute inset-0 bg-amet-indigo/0 transition group-hover:bg-amet-indigo/10" />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-amet-indigo/90 p-6 backdrop-blur-sm"
          onClick={() => setOpenIndex(null)}
        >
          <div ref={panelRef} className="relative max-h-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroCarouselImages[openIndex].src}
              alt={heroCarouselImages[openIndex].alt}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
            <p className="mt-4 text-center text-sm text-amet-white/70">{heroCarouselImages[openIndex].alt}</p>

            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setOpenIndex(null)}
              className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full border border-amet-white/25 text-amet-white transition hover:bg-amet-white/10"
            >
              ✕
            </button>
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => setOpenIndex((current) => (current === null ? current : (current - 1 + heroCarouselImages.length) % heroCarouselImages.length))}
              className="absolute top-1/2 -left-4 flex h-10 w-10 -translate-x-full -translate-y-1/2 items-center justify-center rounded-full border border-amet-white/25 text-amet-white transition hover:bg-amet-white/10 sm:-left-6"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Próxima"
              onClick={() => setOpenIndex((current) => (current === null ? current : (current + 1) % heroCarouselImages.length))}
              className="absolute top-1/2 -right-4 flex h-10 w-10 -translate-y-1/2 translate-x-full items-center justify-center rounded-full border border-amet-white/25 text-amet-white transition hover:bg-amet-white/10 sm:-right-6"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </>
  );
}
