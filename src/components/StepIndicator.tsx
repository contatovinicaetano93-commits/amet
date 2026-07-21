"use client";

type StepIndicatorProps = {
  currentStep: number;
  labels: readonly string[];
};

export function StepIndicator({ currentStep, labels }: StepIndicatorProps) {
  return (
    <ol className="flex flex-wrap gap-2">
      {labels.map((label, index) => {
        const number = index + 1;
        const isActive = number === currentStep;
        const isComplete = number < currentStep;

        return (
          <li
            key={label}
            aria-current={isActive ? "step" : undefined}
            className={`min-w-[90px] flex-1 rounded-xl border px-2 py-2 sm:px-3 sm:py-3 ${
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
              <span className={`text-xs font-medium sm:text-sm ${isActive ? "text-amet-blue" : "text-amet-indigo/70"}`}>
                {label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
