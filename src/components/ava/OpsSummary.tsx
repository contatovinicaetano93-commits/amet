import Link from "next/link";

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
    <section className="ava-fade-in-delay space-y-6">
      <div className="space-y-1">
        <p className="ava-kicker">Operação</p>
        <h2 className="text-2xl font-semibold tracking-tight text-amet-indigo">
          Acompanhe o AVA
        </h2>
        <p className="text-sm text-[var(--ava-muted)]">
          Visão rápida de pessoas, turmas, aulas e dúvidas em aberto.
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="border-t border-[var(--ava-line-strong)] pt-3"
          >
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ava-muted)]">
              {item.label}
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-amet-indigo">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="ava-panel space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-lg font-semibold text-amet-indigo">
            Dúvidas em aberto
          </h3>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--ava-muted)]">
            {openDoubts.length} listada{openDoubts.length === 1 ? "" : "s"}
          </p>
        </div>

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
                  <p className="ava-kicker">
                    {doubt.subjectName} · {doubt.className}
                  </p>
                  <p className="mt-1 font-medium text-amet-indigo">
                    {doubt.lessonTitle}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--ava-muted)]">
                    {doubt.askerName}: {doubt.body}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
