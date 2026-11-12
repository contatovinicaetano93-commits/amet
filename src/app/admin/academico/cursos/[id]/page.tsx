import { notFound } from "next/navigation";

import { AcademicoCard, AcademicoChrome, academicoFieldClass } from "@/components/admin/AcademicoChrome";
import { addDiscipline } from "@/lib/academico/actions";
import { modalityLabel } from "@/lib/academico/rules";
import { readAcademico } from "@/lib/academico/store";

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const db = await readAcademico();
  const course = db.courses.find((item) => item.id === id);
  if (!course) notFound();
  const disciplines = course.disciplinaIds
    .map((disciplineId) => db.disciplines.find((item) => item.id === disciplineId))
    .filter((item) => item !== undefined);

  return (
    <AcademicoChrome
      title={course.titulo}
      description={`${course.codigo} · ${modalityLabel(course.modalidade)} · ${course.cargaHoraria} h`}
      ok={query.ok}
      erro={query.erro}
    >
      <AcademicoCard>
        <h2 className="font-semibold text-amet-indigo">Disciplinas</h2>
        {disciplines.length === 0 ? <p className="mt-3 text-sm text-amet-indigo/70">Nenhuma disciplina ainda.</p> : null}
        <ul className="mt-3 grid gap-2">
          {disciplines.map((discipline) => (
            <li key={discipline.id} className="flex justify-between text-sm">
              <span>{discipline.titulo}</span>
              <span className="text-amet-indigo/60">{discipline.horas} h</span>
            </li>
          ))}
        </ul>
        <form action={addDiscipline} className="mt-5 grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
          <input type="hidden" name="courseId" value={course.id} />
          <label className="block text-sm font-medium text-amet-indigo">
            Nome
            <input className={academicoFieldClass} name="titulo" required />
          </label>
          <label className="block text-sm font-medium text-amet-indigo">
            Horas
            <input className={academicoFieldClass} name="horas" type="number" min={1} required />
          </label>
          <button type="submit" className="rounded-full bg-amet-blue px-5 py-2.5 text-sm font-semibold text-white">
            Incluir
          </button>
        </form>
      </AcademicoCard>
    </AcademicoChrome>
  );
}
