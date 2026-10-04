"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

import { setLenis } from "@/lib/lenis";
import { isNativeScrollRoute } from "@/lib/nativeScrollRoutes";

gsap.registerPlugin(ScrollTrigger);

/**
 * Liga Lenis (scroll suave) ao ticker do GSAP para que ScrollTrigger
 * (parallax, stagger) leia a posição de rolagem virtual corretamente.
 * Formulários usam scroll nativo: Lenis + html h-full clipam conteúdo
 * longo e travam o foco dos campos.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    if (isNativeScrollRoute(pathname)) {
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      autoResize: true,
    });
    setLenis(lenis);

    lenis.on("scroll", ScrollTrigger.update);

    const syncLenis = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(syncLenis);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(syncLenis);
      lenis.destroy();
      setLenis(null);
      ScrollTrigger.refresh();
    };
  }, [pathname]);

  return null;
}
