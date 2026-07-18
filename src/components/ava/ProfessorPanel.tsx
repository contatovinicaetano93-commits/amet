import Link from "next/link";

import { classManagePath } from "@/lib/ava/navigation";

type ClassRow = {
  id: string;
  name: string;
  subjectName: string;
  lessonCount: number;
  studentCount: number;
};

type ProfessorPanelProps = {
  teacherName: string;
  classes: ClassRow[];
};

export function ProfessorPanel({ teacherName, classes }: ProfessorPanelProps) {
  const firstName = teacherName.split(" ")[0] || "Professor(a)";

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-amet-purple">
          Painel do professor
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-amet-indigo sm:text-4xl">
          Olá, {firstName}
        </h1>
        <p className="max-w-2xl text-amet-indigo/70">
          Aqui você gerencia suas turmas, publica vídeo-aulas e acompanha o
          progresso dos alunos.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-semibold text-amet-indigo">
            Minhas turmas
          </h2>
          <p className="text-sm text-amet-indigo/55">
            {classes.length} turma{classes.length === 1 ? "" : "s"}
          </p>
        </div>

        {classes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-amet-indigo/20 bg-white/80 px-5 py-8">
            <h3 className="text-lg font-semibold text-amet-indigo">
              Nenhuma turma atribuída ainda
            </h3>
            <p className="mt-2 max-w-xl text-amet-indigo/70">
              O administrador precisa criar uma matéria, abrir a turma e
              atribuir você como professor. Assim que isso acontecer, a turma
              aparece aqui com o botão para gerir aulas.
            </p>
            <ol className="mt-5 space-y-2 text-sm text-amet-indigo/70">
              <li>1. Admin cria a matéria</li>
              <li>2. Admin cria a turma e escolhe você como professor</li>
              <li>3. Você volta aqui e publica as vídeo-aulas</li>
            </ol>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {classes.map((classRow) => (
              <li key={classRow.id}>
                <div className="flex h-full flex-col rounded-lg border border-amet-indigo/10 bg-white/90 p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-amet-purple">
                    {classRow.subjectName}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-amet-indigo">
                    {classRow.name}
                  </h3>
                  <p className="mt-2 text-sm text-amet-indigo/60">
                    {classRow.lessonCount} aula
                    {classRow.lessonCount === 1 ? "" : "s"} ·{" "}
                    {classRow.studentCount} aluno
                    {classRow.studentCount === 1 ? "" : "s"}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={classManagePath(classRow.id)}
                      className="inline-flex rounded-md bg-amet-indigo px-3 py-2 text-sm font-semibold text-white hover:bg-amet-blue"
                    >
                      Gerir aulas
                    </Link>
                    <Link
                      href={`/ava/turmas/${classRow.id}`}
                      className="inline-flex rounded-md border border-amet-indigo/15 px-3 py-2 text-sm font-medium text-amet-indigo hover:bg-white"
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
