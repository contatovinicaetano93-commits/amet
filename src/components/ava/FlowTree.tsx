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
          <p className="ava-kicker">O que fazer agora</p>
          <h2
            className={`font-semibold tracking-tight text-amet-indigo ${
              compact ? "text-lg" : "text-xl"
            }`}
          >
            {tree.title}
          </h2>
          <p className="text-sm text-[var(--ava-muted)]">{tree.subtitle}</p>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ava-muted)]">
          {remaining === 0
            ? "Completo"
            : `${remaining} passo${remaining > 1 ? "s" : ""}`}
        </p>
      </div>

      <ol className="space-y-2">
        {tree.steps.map((step, index) => {
          const body = (
            <>
              <span
                className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  step.done
                    ? "bg-emerald-50 text-emerald-800"
                    : step.current
                      ? "bg-amet-indigo text-white"
                      : "bg-[rgba(40,90,206,0.08)] text-amet-indigo"
                }`}
              >
                {step.done ? "✓" : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-amet-indigo">{step.title}</p>
                <p className="text-sm text-[var(--ava-muted)]">{step.detail}</p>
              </div>
              {step.href && !step.done ? (
                <span className="text-amet-blue" aria-hidden>
                  ›
                </span>
              ) : null}
            </>
          );

          const className =
            "flex items-start gap-3 rounded-xl border border-[var(--ava-line)] bg-[var(--ava-canvas)] px-3 py-3";

          if (step.href && !step.done) {
            return (
              <li key={step.id}>
                <Link
                  href={step.href}
                  className={`${className} transition hover:border-[rgba(40,90,206,0.35)] hover:bg-white`}
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
