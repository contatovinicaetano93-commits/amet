"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { heroCarouselImages } from "@/lib/content";

const CROSSFADE_DURATION_S = heroCarouselImages.length * 10;

type HeroSceneProps = {
  children: ReactNode;
};

export function HeroScene({ children }: HeroSceneProps) {
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const handleMove = (event: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const mx = (event.clientX - rect.left) / rect.width - 0.5;
      const my = (event.clientY - rect.top) / rect.height - 0.5;
      hero.style.setProperty("--mx", mx.toFixed(3));
      hero.style.setProperty("--my", my.toFixed(3));
      hero.style.setProperty("--rx", `${(mx * 6).toFixed(2)}deg`);
      hero.style.setProperty("--ry", `${(my * -6).toFixed(2)}deg`);
    };

    const handleLeave = () => {
      hero.style.setProperty("--mx", "0");
      hero.style.setProperty("--my", "0");
      hero.style.setProperty("--rx", "0deg");
      hero.style.setProperty("--ry", "0deg");
    };

    hero.addEventListener("mousemove", handleMove);
    hero.addEventListener("mouseleave", handleLeave);
    return () => {
      hero.removeEventListener("mousemove", handleMove);
      hero.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      id="inicio"
      className="amet-hero relative flex min-h-screen items-center overflow-hidden bg-amet-indigo py-28"
      style={
        {
          "--hero-crossfade-duration": `${CROSSFADE_DURATION_S}s`,
        } as React.CSSProperties
      }
    >
      <div className="amet-hero-scene pointer-events-none absolute inset-0" aria-hidden>
        <div className="amet-hero-photo-panel">
          {heroCarouselImages.map((photo, index) => (
            <div
              key={photo.src}
              className="amet-hero-photo-slide"
              style={{
                backgroundImage: `url(${photo.src})`,
                animationDelay: `${index * 10}s`,
              }}
            />
          ))}
          <div className="amet-hero-photo-scrim" />
          <div className="amet-hero-photo-tint" />
        </div>
        <div className="amet-hero-bg-grid" />
        <div className="amet-hero-glow amet-hero-glow-1" />
        <div className="amet-hero-glow amet-hero-glow-2" />
      </div>

      <div className="amet-hero-inner relative z-10 w-full px-6">{children}</div>
    </section>
  );
}
