import Link from "next/link";

import { CollapsibleCard } from "@/components/ava/CollapsibleCard";
import type { OpenDoubt, OpsSnapshot } from "@/lib/ava/ops";

type OpsSummaryProps = {
  snapshot: OpsSnapshot;
  openDoubts: OpenDoubt[];
};

export function OpsSummary({ snapshot, openDoubts }: OpsSummaryProps) {
  const items = [
    { label: "Professores", value: snapshot.professors },
    { label: "Alunos", value: snapshot.students },
    { label: "Turmas", value: snapshot.classes },
    { label: "Sem professor", value: snapshot.classesWithoutTeacher },
    { label: "Matrículas", value: snapshot.enrollments },
    { label: "Aulas publicadas", value: snapshot.publishedLessons },
    { label: "Convites pendentes", value: snapshot.pendingInvites },
    { label: "Dúvidas abertas", value: snapshot.openDoubts },
  ];

  return (
    <section className="ava-fade-in-delay space-y-5">
      <CollapsibleCard
        kicker="Hoje no AVA"
        title="Acompanhe a operação"
        description="Pessoas, turmas, aulas e dúvidas em aberto"
      >
        <dl className="ava-kpi-grid">
          {items.map((item) => (
            <div key={item.label} className="ava-kpi">
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </CollapsibleCard>

      <CollapsibleCard
        kicker="Dúvidas"
        title="Dúvidas em aberto"
        description={`${openDoubts.length} listada${openDoubts.length === 1 ? "" : "s"}`}
        defaultOpen={false}
      >
        {openDoubts.length === 0 ? (
          <p className="text-sm text-[var(--ava-muted)]">
            Nenhuma dúvida aguardando resposta.
          </p>
        ) : (
          <ul>
            {openDoubts.map((doubt) => (
              <li key={doubt.id}>
                <Link
                  href={`/ava/turmas/${doubt.classId}/aulas/${doubt.lessonId}`}
                  className="ava-row"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="ava-kicker">
                        {doubt.subjectName} · {doubt.className}
                      </p>
                      <p className="mt-1 font-semibold text-amet-indigo">
                        {doubt.lessonTitle}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--ava-muted)]">
                        {doubt.askerName}: {doubt.body}
                      </p>
                    </div>
                    <span className="text-amet-blue" aria-hidden>
                      ›
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleCard>
    </section>
  );
}
