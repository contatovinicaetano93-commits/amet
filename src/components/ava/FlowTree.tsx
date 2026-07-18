import Link from "next/link";

import type { FlowTree as FlowTreeModel } from "@/lib/ava/flows";

type FlowTreeProps = {
  tree: FlowTreeModel;
  compact?: boolean;
};

export function FlowTree({ tree, compact = false }: FlowTreeProps) {
  const remaining = tree.steps.filter((step) => !step.done).length;

  return (
    <section
      className={`rounded-lg border border-amet-blue/20 bg-gradient-to-br from-white to-amet-blue/5 ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-amet-purple">
            Fluxo canônico
          </p>
          <h2
            className={`mt-1 font-semibold text-amet-indigo ${
              compact ? "text-lg" : "text-xl"
            }`}
          >
            {tree.title}
          </h2>
          <p className="text-sm text-amet-indigo/65">{tree.subtitle}</p>
        </div>
        <p className="text-xs font-medium text-amet-indigo/55">
          {remaining === 0
            ? "Fluxo completo"
            : `${remaining} passo${remaining > 1 ? "s" : ""} em aberto`}
        </p>
      </div>

      <ol className="space-y-2">
        {tree.steps.map((step, index) => {
          const body = (
            <>
              <span
                className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  step.done
                    ? "bg-emerald-100 text-emerald-700"
                    : step.current
                      ? "bg-amet-indigo text-white"
                      : "bg-amet-indigo/10 text-amet-indigo"
                }`}
              >
                {step.done ? "✓" : index + 1}
              </span>
              <div className="min-w-0">
                <p className="font-medium text-amet-indigo">{step.title}</p>
                <p className="text-sm text-amet-indigo/60">{step.detail}</p>
              </div>
            </>
          );

          const className = `flex items-start gap-3 rounded-md border px-3 py-2.5 ${
            step.current
              ? "border-amet-indigo/25 bg-white shadow-sm"
              : "border-amet-indigo/8 bg-white/80"
          }`;

          if (step.href && !step.done) {
            return (
              <li key={step.id}>
                <Link href={step.href} className={`${className} transition hover:border-amet-blue/30`}>
                  {body}
                </Link>
              </li>
            );
          }

          return (
            <li key={step.id} className={className}>
              {body}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
