"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { heroCarouselImages } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger);

const SLIDE_MS = 2500;
const CROSSFADE_MS = 600;

type HeroSceneProps = {
  children: ReactNode;
};

export function HeroScene({ children }: HeroSceneProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const photoPanelRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [leavingIndex, setLeavingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const hero = heroRef.current;
    const photoPanel = photoPanelRef.current;
    if (!hero || !photoPanel) return;

    const tween = gsap.to(photoPanel, {
      yPercent: 18,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => {
        setLeavingIndex(current);
        return (current + 1) % heroCarouselImages.length;
      });
    }, SLIDE_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (leavingIndex === null) return;

    const timeout = setTimeout(() => setLeavingIndex(null), CROSSFADE_MS);
    return () => clearTimeout(timeout);
  }, [leavingIndex, activeIndex]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    let frame: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const applyTilt = () => {
      frame = null;
      const rect = hero.getBoundingClientRect();
      const mx = (lastX - rect.left) / rect.width - 0.5;
      const my = (lastY - rect.top) / rect.height - 0.5;
      hero.style.setProperty("--mx", mx.toFixed(3));
      hero.style.setProperty("--my", my.toFixed(3));
      hero.style.setProperty("--rx", `${(mx * 6).toFixed(2)}deg`);
      hero.style.setProperty("--ry", `${(my * -6).toFixed(2)}deg`);
    };

    const handleMove = (event: MouseEvent) => {
      lastX = event.clientX;
      lastY = event.clientY;
      if (frame === null) frame = requestAnimationFrame(applyTilt);
    };

    const handleLeave = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
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
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  const isTransitioning = leavingIndex !== null;

  return (
    <section
      ref={heroRef}
      id="inicio"
      className="amet-hero relative flex min-h-screen items-center overflow-hidden bg-amet-indigo py-28"
      style={{ "--hero-crossfade-ms": `${CROSSFADE_MS}ms` } as React.CSSProperties}
    >
      <div className="amet-hero-scene pointer-events-none absolute inset-0" aria-hidden>
        <div ref={photoPanelRef} className="amet-hero-photo-panel">
          {heroCarouselImages.map((photo, index) => {
            const isStable = index === activeIndex && !isTransitioning;
            const isFadeIn = index === activeIndex && isTransitioning;
            const isFadeOut = index === leavingIndex;

            return (
              <div
                key={photo.src}
                className={[
                  "amet-hero-photo-slide",
                  isStable ? "is-stable" : "",
                  isFadeIn ? "is-fade-in" : "",
                  isFadeOut ? "is-fade-out" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ backgroundImage: `url(${photo.src})` }}
              />
            );
          })}
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
