import Link from "next/link";

import type { OpenDoubt } from "@/lib/ava/ops";

type DoubtsInboxProps = {
  doubts: OpenDoubt[];
};

export function DoubtsInbox({ doubts }: DoubtsInboxProps) {
  return (
    <section className="ava-fade-in-delay space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="ava-kicker">Dúvidas</p>
          <h2 className="text-2xl font-semibold tracking-tight text-amet-indigo">
            Aguardando sua resposta
          </h2>
          <p className="text-sm text-[var(--ava-muted)]">
            Abra a aula para responder o aluno.
          </p>
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--ava-muted)]">
          {doubts.length} em aberto
        </p>
      </div>

      {doubts.length === 0 ? (
        <p className="ava-panel text-sm text-[var(--ava-muted)]">
          Nenhuma dúvida pendente nas suas turmas.
        </p>
      ) : (
        <ul>
          {doubts.map((doubt) => (
            <li key={doubt.id}>
              <Link
                href={`/ava/turmas/${doubt.classId}/aulas/${doubt.lessonId}`}
                className="ava-row"
              >
                <p className="ava-kicker">
                  {doubt.subjectName} · {doubt.className}
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-amet-indigo">
                  {doubt.lessonTitle}
                </p>
                <p className="mt-1 text-sm text-[var(--ava-muted)]">
                  {doubt.askerName} ·{" "}
                  {doubt.createdAt.toLocaleString("pt-BR")}
                </p>
                <p className="mt-2 line-clamp-3 text-amet-indigo/85">
                  {doubt.body}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
