import { AcademicoCard, AcademicoChrome, academicoFieldClass } from "@/components/admin/AcademicoChrome";
import { createProfessor, updateClassStatus } from "@/lib/academico/actions";
import { classStatusLabel, formatDate, sortedClasses } from "@/lib/academico/rules";
import { readAcademico } from "@/lib/academico/store";

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const query = await searchParams;
  const db = await readAcademico();
  const classes = sortedClasses(db.onlineClasses);

  return (
    <AcademicoChrome
      title="Aulas online"
      description="O administrativo cola o link do Meet. Quem entra na sala não recebe a senha da conta Google."
      section="aulas"
      ok={query.ok}
      erro={query.erro}
      action={
        <a href="/admin/academico/aulas/nova" className="rounded-full bg-amet-blue px-5 py-2.5 text-sm font-semibold text-white">
          Nova aula
        </a>
      }
    >
      <AcademicoCard>
        <h2 className="font-semibold text-amet-indigo">Professores</h2>
        <p className="mt-1 text-sm text-amet-indigo/70">
          {db.professors.length === 0 ? "Inclua o professor antes de cadastrar a aula." : db.professors.map((item) => item.nome).join(", ")}
        </p>
        <form action={createProfessor} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm font-medium text-amet-indigo">
            Nome
            <input className={academicoFieldClass} name="nome" required />
          </label>
          <button type="submit" className="rounded-full border border-amet-blue/20 px-5 py-2.5 text-sm font-semibold text-amet-blue">
            Incluir professor
          </button>
        </form>
      </AcademicoCard>
      <div className="mt-4 grid gap-3">
        {classes.length === 0 ? <p className="text-sm text-amet-indigo/70">Nenhuma aula cadastrada.</p> : null}
        {classes.map((item) => {
          const course = db.courses.find((courseItem) => courseItem.id === item.courseId);
          const professor = db.professors.find((professorItem) => professorItem.id === item.professorId);
          return (
            <AcademicoCard key={item.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold text-amet-indigo">{item.titulo}</h2>
                  <p className="mt-1 text-sm text-amet-indigo/70">
                    {course?.titulo ?? "Curso"} · {professor?.nome ?? "Professor"} · {formatDate(item.data)} · {item.inicio}–{item.fim} · {classStatusLabel(item.status)}
                  </p>
                </div>
                {item.status === "agendada" ? (
                  <a href={item.meetUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-amet-blue px-4 py-2 text-sm font-semibold text-white">
                    Entrar
                  </a>
                ) : null}
              </div>
              <form action={updateClassStatus} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <input type="hidden" name="id" value={item.id} />
                <label className="block text-sm font-medium text-amet-indigo">
                  Status
                  <select className={academicoFieldClass} name="status" defaultValue={item.status}>
                    <option value="agendada">Agendada</option>
                    <option value="realizada">Realizada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </label>
                <button type="submit" className="rounded-full border border-amet-blue/20 px-4 py-2.5 text-sm font-semibold text-amet-blue">
                  Atualizar
                </button>
              </form>
            </AcademicoCard>
          );
        })}
      </div>
    </AcademicoChrome>
  );
}
