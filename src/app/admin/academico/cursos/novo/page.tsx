import { AcademicoCard, AcademicoChrome, academicoFieldClass } from "@/components/admin/AcademicoChrome";
import { createCourse } from "@/lib/academico/actions";

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const query = await searchParams;
  return (
    <AcademicoChrome title="Novo curso" description="Pós-graduação ou residência." erro={query.erro}>
      <AcademicoCard>
        <form action={createCourse} className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-amet-indigo">
            Código
            <input className={academicoFieldClass} name="codigo" required placeholder="POS-EST" />
          </label>
          <label className="block text-sm font-medium text-amet-indigo">
            Modalidade
            <select className={academicoFieldClass} name="modalidade" defaultValue="pos">
              <option value="pos">Pós-graduação</option>
              <option value="residencia">Residência</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-amet-indigo sm:col-span-2">
            Título
            <input className={academicoFieldClass} name="titulo" required />
          </label>
          <label className="block text-sm font-medium text-amet-indigo">
            Área
            <input className={academicoFieldClass} name="area" required />
          </label>
          <label className="block text-sm font-medium text-amet-indigo">
            Carga horária
            <input className={academicoFieldClass} name="cargaHoraria" type="number" min={1} required />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-full bg-amet-blue px-6 py-3 text-sm font-semibold text-white">
              Criar curso
            </button>
          </div>
        </form>
      </AcademicoCard>
    </AcademicoChrome>
  );
}
