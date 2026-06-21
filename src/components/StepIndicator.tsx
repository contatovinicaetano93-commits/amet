"use client";

type StepIndicatorProps = {
  currentStep: number;
};

const STEPS = [
  { number: 1, label: "Dados Pessoais" },
  { number: 2, label: "Área de Interesse" },
  { number: 3, label: "Curso Atual" },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {STEPS.map((step) => {
        const isActive = step.number === currentStep;
        const isComplete = step.number < currentStep;

        return (
          <li
            key={step.number}
            className={`rounded-2xl border px-4 py-3 transition-colors ${
              isActive
                ? "border-amet-blue bg-amet-blue/10"
                : isComplete
                  ? "border-amet-purple bg-amet-purple/10"
                  : "border-amet-white/15 bg-amet-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  isActive
                    ? "bg-amet-blue text-amet-white"
                    : isComplete
                      ? "bg-amet-purple text-amet-white"
                      : "bg-amet-white/10 text-amet-white/60"
                }`}
              >
                {step.number}
              </span>
              <span
                className={`text-sm font-medium ${
                  isActive ? "text-amet-blue" : "text-amet-white/80"
                }`}
              >
                {step.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
