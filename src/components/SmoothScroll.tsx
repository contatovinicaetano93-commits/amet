"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import { setLenis } from "@/lib/lenis";

gsap.registerPlugin(ScrollTrigger);

/**
 * Liga Lenis (scroll suave) ao ticker do GSAP para que ScrollTrigger
 * (parallax, stagger) leia a posição de rolagem virtual corretamente.
 * Não inicializa nada se o usuário preferir menos movimento.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    });
    setLenis(lenis);

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
