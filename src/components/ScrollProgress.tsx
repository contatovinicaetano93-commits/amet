"use client";

import { useEffect, useRef } from "react";

/**
 * Barra fina de progresso de leitura no topo da página. Manipula o DOM
 * direto via ref (sem setState por frame) e usa rAF para não rodar mais
 * de uma vez por frame durante o scroll.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let frame: number | null = null;

    const applyProgress = () => {
      frame = null;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
    };

    const handleScroll = () => {
      if (frame === null) frame = requestAnimationFrame(applyProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    applyProgress();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-[3px] bg-transparent">
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-gradient-to-r from-amet-purple via-amet-blue to-amet-indigo"
        style={{ transform: "scaleX(0)", willChange: "transform" }}
      />
    </div>
  );
}
