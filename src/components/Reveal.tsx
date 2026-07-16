"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Revela o conteúdo com um fade sutil quando entra na viewport.
 * Pensado para ser usado uma vez por seção, não em cascata por card
 * (o momento coreografado da página é o hero). Com prefers-reduced-motion,
 * mostra direto sem animação.
 */
export function Reveal({ children, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const check = () => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 40 && rect.bottom > 0) {
        setVisible(true);
        cleanup();
      }
    };
    const cleanup = () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };

    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    check();
    return cleanup;
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-opacity duration-700 ease-out ${visible ? "opacity-100" : "opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}
