import { AcademicoChrome } from "@/components/admin/AcademicoChrome";
import { modalityLabel } from "@/lib/academico/rules";
import { readAcademico } from "@/lib/academico/store";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const query = await searchParams;
  const db = await readAcademico();
  return (
    <AcademicoChrome
      title="Cursos"
      description="Só pós-graduação e residência. Um curso novo abre por aqui."
      ok={query.ok}
      erro={query.erro}
      action={
        <a href="/admin/academico/cursos/novo" className="rounded-full bg-amet-blue px-5 py-2.5 text-sm font-semibold text-white">
          Novo curso
        </a>
      }
    >
      {db.courses.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-amet-blue/20 px-4 py-8 text-sm text-amet-indigo/70">
          Nenhum curso ainda.
        </p>
      ) : (
        <div className="grid gap-3">
          {db.courses.map((course) => (
            <a key={course.id} href={`/admin/academico/cursos/${course.id}`} className="rounded-2xl border border-amet-blue/15 bg-white px-5 py-4">
              <span className="text-xs font-semibold tracking-wide text-amet-blue uppercase">{course.codigo}</span>
              <span className="mt-1 block font-semibold text-amet-indigo">{course.titulo}</span>
              <span className="mt-1 block text-sm text-amet-indigo/70">
                {modalityLabel(course.modalidade)} · {course.cargaHoraria} h · {course.status === "ativo" ? "Ativo" : "Inativo"}
              </span>
            </a>
          ))}
        </div>
      )}
    </AcademicoChrome>
  );
}
