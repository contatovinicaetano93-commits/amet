import Link from "next/link";

import type { FlowTree as FlowTreeModel } from "@/lib/ava/flows";

type FlowTreeProps = {
  tree: FlowTreeModel;
  compact?: boolean;
};

export function FlowTree({ tree, compact = false }: FlowTreeProps) {
  const remaining = tree.steps.filter((step) => !step.done).length;

  return (
    <section className={`ava-panel ${compact ? "space-y-4" : "space-y-5"}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="ava-kicker">Percurso</p>
          <h2
            className={`font-semibold tracking-tight text-amet-indigo ${
              compact ? "text-xl" : "text-2xl"
            }`}
          >
            {tree.title}
          </h2>
          <p className="text-sm text-[var(--ava-muted)]">{tree.subtitle}</p>
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--ava-muted)]">
          {remaining === 0
            ? "Completo"
            : `${remaining} passo${remaining > 1 ? "s" : ""}`}
        </p>
      </div>

      <ol className="space-y-0">
        {tree.steps.map((step, index) => {
          const body = (
            <>
              <span
                className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center border text-xs font-semibold ${
                  step.done
                    ? "border-emerald-700/30 text-emerald-800"
                    : step.current
                      ? "border-amet-indigo bg-amet-indigo text-white"
                      : "border-[var(--ava-line-strong)] text-[var(--ava-muted)]"
                }`}
              >
                {step.done ? "✓" : index + 1}
              </span>
              <div className="min-w-0">
                <p className="font-medium text-amet-indigo">{step.title}</p>
                <p className="text-sm text-[var(--ava-muted)]">{step.detail}</p>
              </div>
            </>
          );

          const className =
            "flex items-start gap-3 border-t border-[var(--ava-line)] py-3 first:border-t-0";

          if (step.href && !step.done) {
            return (
              <li key={step.id}>
                <Link
                  href={step.href}
                  className={`${className} transition hover:bg-white/50`}
                >
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
