import Link from "next/link";

import { DoubtsInbox } from "@/components/ava/DoubtsInbox";
import { FlowTree } from "@/components/ava/FlowTree";
import { buildProfessorFlow } from "@/lib/ava/flows";
import { classManagePath } from "@/lib/ava/navigation";
import type { OpenDoubt } from "@/lib/ava/ops";
import { shiftDetail } from "@/lib/ava/shifts";

type ClassRow = {
  id: string;
  name: string;
  shift: string | null;
  subjectName: string;
  lessonCount: number;
  publishedCount: number;
  studentCount: number;
};

type ProfessorPanelProps = {
  teacherName: string;
  classes: ClassRow[];
  openDoubts: OpenDoubt[];
};

export function ProfessorPanel({
  teacherName,
  classes,
  openDoubts,
}: ProfessorPanelProps) {
  const firstName = teacherName.split(" ")[0] || "Professor(a)";
  const firstClass = classes[0] ?? null;
  const lessonsCount = classes.reduce((sum, row) => sum + row.lessonCount, 0);
  const publishedCount = classes.reduce(
    (sum, row) => sum + row.publishedCount,
    0,
  );

  const tree = buildProfessorFlow({
    classesCount: classes.length,
    lessonsCount,
    publishedCount,
    firstClassId: firstClass?.id ?? null,
  });

  return (
    <div className="space-y-12">
      <section className="ava-fade-in space-y-4">
        <p className="ava-kicker">Painel do professor</p>
        <h1 className="ava-display text-4xl text-amet-indigo sm:text-5xl">
          Olá, {firstName}
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-[var(--ava-muted)]">
          Gerencie turmas, publique aulas e responda dúvidas dos alunos.
        </p>
      </section>

      <div className="ava-fade-in-delay">
        <FlowTree tree={tree} />
      </div>

      <DoubtsInbox doubts={openDoubts} />

      <section className="ava-fade-in-delay-2 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="ava-kicker">Turmas</p>
            <h2 className="text-2xl font-semibold tracking-tight text-amet-indigo">
              Minhas turmas
            </h2>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--ava-muted)]">
            {classes.length} turma{classes.length === 1 ? "" : "s"}
          </p>
        </div>

        {classes.length === 0 ? (
          <div className="ava-panel">
            <h3 className="text-lg font-semibold text-amet-indigo">
              Nenhuma turma atribuída ainda
            </h3>
            <p className="mt-2 max-w-xl text-[var(--ava-muted)]">
              O administrador precisa criar a matéria, abrir a turma e atribuir
              você como professor.
            </p>
          </div>
        ) : (
          <ul>
            {classes.map((classRow) => (
              <li key={classRow.id}>
                <div className="ava-row">
                  <p className="ava-kicker">{classRow.subjectName}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-amet-indigo">
                    {classRow.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ava-muted)]">
                    {[
                      shiftDetail(classRow.shift),
                      classRow.lessonCount === 0
                        ? "Sem aulas ainda"
                        : `${classRow.publishedCount}/${classRow.lessonCount} publicadas`,
                      `${classRow.studentCount} aluno${classRow.studentCount === 1 ? "" : "s"}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4">
                    <Link
                      href={classManagePath(classRow.id)}
                      className="ava-link text-sm font-semibold"
                    >
                      {classRow.lessonCount === 0
                        ? "Gerir aulas (criar)"
                        : `Gerir aulas (${classRow.lessonCount})`}
                    </Link>
                    <Link
                      href={`/ava/turmas/${classRow.id}`}
                      className="ava-link text-sm"
                    >
                      Ver como aluno
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
