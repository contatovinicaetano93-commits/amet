import Link from "next/link";

type AdminOnboardingProps = {
  subjectsCount: number;
  classesCount: number;
  usersCount: number;
  invitesPendingCount: number;
};

export function AdminOnboarding({
  subjectsCount,
  classesCount,
  usersCount,
  invitesPendingCount,
}: AdminOnboardingProps) {
  const steps = [
    {
      id: "invite",
      done: usersCount > 1 || invitesPendingCount > 0,
      title: "Convidar professor e alunos",
      detail: "Envie convites pelo painel admin.",
    },
    {
      id: "subject",
      done: subjectsCount > 0,
      title: "Criar uma matéria",
      detail: "Ex.: Estética facial, Imagem, etc.",
    },
    {
      id: "class",
      done: classesCount > 0,
      title: "Abrir uma turma",
      detail: "Vincule matéria, professor e alunos.",
    },
    {
      id: "lesson",
      done: false,
      title: "Publicar a primeira vídeo-aula",
      detail: "Na turma, crie a aula e envie o vídeo (R2).",
      optionalNote: classesCount === 0 ? "Depois de criar a turma." : undefined,
    },
  ] as const;

  const remaining = steps.filter((step) => !step.done).length;
  if (remaining === 0) return null;

  return (
    <section className="rounded-lg border border-amet-blue/20 bg-gradient-to-br from-white to-amet-blue/5 p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-amet-purple">
            Comece por aqui
          </p>
          <h2 className="mt-1 text-xl font-semibold text-amet-indigo">
            Checklist do AVA
          </h2>
          <p className="text-sm text-amet-indigo/65">
            {remaining} passo{remaining > 1 ? "s" : ""} para ter a primeira
            turma rodando.
          </p>
        </div>
        <Link
          href="/ava/admin"
          className="rounded-md bg-amet-indigo px-3 py-2 text-sm font-semibold text-white hover:bg-amet-blue"
        >
          Ir ao admin
        </Link>
      </div>

      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className="flex items-start gap-3 rounded-md border border-amet-indigo/8 bg-white/80 px-3 py-2.5"
          >
            <span
              className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                step.done
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amet-indigo/10 text-amet-indigo"
              }`}
            >
              {step.done ? "✓" : index + 1}
            </span>
            <div>
              <p className="font-medium text-amet-indigo">{step.title}</p>
              <p className="text-sm text-amet-indigo/60">{step.detail}</p>
              {"optionalNote" in step && step.optionalNote ? (
                <p className="text-xs text-amet-indigo/45">{step.optionalNote}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
