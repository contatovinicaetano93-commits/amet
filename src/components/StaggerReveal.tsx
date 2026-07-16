"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type StaggerRevealProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Anima os filhos diretos (cards) em cascata quando o grid entra na
 * viewport. Pensado para grids reais de cartões (cursos, programas,
 * áreas de estágio) — não usar em listas de texto genéricas.
 */
export function StaggerReveal({ children, className }: StaggerRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = Array.from(el.children);
    gsap.set(targets, { opacity: 0, y: 24 });

    const tween = gsap.to(targets, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out",
      stagger: 0.12,
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        once: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
