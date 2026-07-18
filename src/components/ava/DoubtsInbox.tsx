import Link from "next/link";

import { CollapsibleCard } from "@/components/ava/CollapsibleCard";
import type { OpenDoubt } from "@/lib/ava/ops";

type DoubtsInboxProps = {
  doubts: OpenDoubt[];
};

export function DoubtsInbox({ doubts }: DoubtsInboxProps) {
  return (
    <div className="ava-fade-in-delay">
      <CollapsibleCard
        kicker="Dúvidas"
        title="Aguardando sua resposta"
        description={`Abra a aula para responder o aluno · ${doubts.length} em aberto`}
      >
        {doubts.length === 0 ? (
          <p className="text-sm text-[var(--ava-muted)]">
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
      </CollapsibleCard>
    </div>
  );
}
