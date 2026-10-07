"use client";

import { useEffect, useRef } from "react";

type StepIndicatorProps = {
  currentStep: number;
  labels: readonly string[];
};

export function StepIndicator({ currentStep, labels }: StepIndicatorProps) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const active = listRef.current?.querySelector<HTMLElement>("[aria-current='step']");
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentStep, labels]);

  return (
    <ol
      ref={listRef}
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]"
    >
      {labels.map((label, index) => {
        const number = index + 1;
        const isActive = number === currentStep;
        const isComplete = number < currentStep;

        return (
          <li
            key={`${number}-${label}`}
            aria-current={isActive ? "step" : undefined}
            className={`shrink-0 rounded-xl border px-3 py-2.5 ${
              isActive
                ? "border-amet-blue bg-amet-blue/5"
                : isComplete
                  ? "border-amet-purple/30 bg-amet-purple/5"
                  : "border-amet-indigo/10 bg-amet-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-amet-blue text-amet-white"
                    : isComplete
                      ? "bg-amet-purple-contrast text-amet-white"
                      : "bg-amet-indigo/10 text-amet-indigo/70"
                }`}
              >
                {number}
              </span>
              <span
                className={`whitespace-nowrap text-xs font-medium sm:text-sm ${
                  isActive ? "text-amet-blue" : "text-amet-indigo/70"
                }`}
              >
                {label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
