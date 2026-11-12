import { AcademicoCard, AcademicoChrome, academicoFieldClass } from "@/components/admin/AcademicoChrome";
import { createOnlineClass } from "@/lib/academico/actions";
import { readAcademico } from "@/lib/academico/store";

export default async function NewClassPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const query = await searchParams;
  const db = await readAcademico();
  return (
    <AcademicoChrome
      title="Nova aula"
      description="Cole o link https do Google Meet. A senha da conta institucional não entra neste formulário."
      section="aulas"
      erro={query.erro}
    >
      <AcademicoCard>
        <form action={createOnlineClass} className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-amet-indigo sm:col-span-2">
            Título
            <input className={academicoFieldClass} name="titulo" required />
          </label>
          <label className="block text-sm font-medium text-amet-indigo">
            Curso
            <select className={academicoFieldClass} name="courseId" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {db.courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.titulo}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-amet-indigo">
            Professor
            <select className={academicoFieldClass} name="professorId" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {db.professors.map((professor) => (
                <option key={professor.id} value={professor.id}>
                  {professor.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-amet-indigo">
            Data
            <input className={academicoFieldClass} name="data" type="date" required />
          </label>
          <label className="block text-sm font-medium text-amet-indigo">
            Início
            <input className={academicoFieldClass} name="inicio" type="time" required />
          </label>
          <label className="block text-sm font-medium text-amet-indigo">
            Fim
            <input className={academicoFieldClass} name="fim" type="time" required />
          </label>
          <label className="block text-sm font-medium text-amet-indigo sm:col-span-2">
            Link do Google Meet
            <input className={academicoFieldClass} name="meetUrl" type="url" required placeholder="https://meet.google.com/..." />
          </label>
          <label className="block text-sm font-medium text-amet-indigo sm:col-span-2">
            Observação
            <input className={academicoFieldClass} name="observacao" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-full bg-amet-blue px-6 py-3 text-sm font-semibold text-white">
              Cadastrar aula
            </button>
          </div>
        </form>
      </AcademicoCard>
    </AcademicoChrome>
  );
}
