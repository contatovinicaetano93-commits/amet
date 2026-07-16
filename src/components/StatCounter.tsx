"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type StatCounterProps = {
  value: string;
  className?: string;
};

/** Conta de 0 até o valor real (ex.: "1992", "20+") quando montado. */
export function StatCounter({ value, className }: StatCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const match = value.match(/^(\d+)(.*)$/);
    if (!match || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = value;
      return;
    }

    const [, numStr, suffix] = match;
    const target = Number(numStr);
    const counter = { current: 0 };

    const tween = gsap.to(counter, {
      current: target,
      duration: 1.6,
      delay: 0.5,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = `${Math.round(counter.current)}${suffix}`;
      },
    });

    return () => {
      tween.kill();
    };
  }, [value]);

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}
