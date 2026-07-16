"use client";

import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";

import { heroCarouselImages } from "@/lib/content";

export function GalleryLightbox() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const next = () => setOpenIndex((current) => (current === null ? current : (current + 1) % heroCarouselImages.length));
  const prev = () =>
    setOpenIndex((current) => (current === null ? current : (current - 1 + heroCarouselImages.length) % heroCarouselImages.length));

  return (
    <>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {heroCarouselImages.map((photo, index) => (
          <button
            key={photo.src}
            type="button"
            onClick={(event) => {
              triggerRef.current = event.currentTarget;
              setOpenIndex(index);
            }}
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

      <Dialog.Root
        open={openIndex !== null}
        onOpenChange={(open) => {
          if (open) return;
          setOpenIndex(null);
          setTimeout(() => triggerRef.current?.focus(), 0);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="amet-dialog-overlay fixed inset-0 z-50 bg-amet-indigo/90 backdrop-blur-sm" />
          <Dialog.Content
            className="amet-dialog-content fixed inset-0 z-50 flex items-center justify-center p-6 outline-none"
            onClick={(event) => {
              if (event.target === event.currentTarget) setOpenIndex(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") next();
              if (event.key === "ArrowLeft") prev();
            }}
          >
            <Dialog.Title className="sr-only">Galeria de fotos da AMET</Dialog.Title>
            <Dialog.Description className="sr-only">
              {openIndex !== null ? heroCarouselImages[openIndex].alt : ""}
            </Dialog.Description>

            {openIndex !== null && (
              <div className="relative max-h-full max-w-4xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroCarouselImages[openIndex].src}
                  alt={heroCarouselImages[openIndex].alt}
                  className="max-h-[80vh] w-full rounded-lg object-contain"
                />
                <p className="mt-4 text-center text-sm text-amet-white/70">{heroCarouselImages[openIndex].alt}</p>

                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Fechar"
                    className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full border border-amet-white/25 text-amet-white transition hover:bg-amet-white/10"
                  >
                    ✕
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  aria-label="Anterior"
                  onClick={prev}
                  className="absolute top-1/2 -left-4 flex h-10 w-10 -translate-x-full -translate-y-1/2 items-center justify-center rounded-full border border-amet-white/25 text-amet-white transition hover:bg-amet-white/10 sm:-left-6"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Próxima"
                  onClick={next}
                  className="absolute top-1/2 -right-4 flex h-10 w-10 -translate-y-1/2 translate-x-full items-center justify-center rounded-full border border-amet-white/25 text-amet-white transition hover:bg-amet-white/10 sm:-right-6"
                >
                  ›
                </button>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
