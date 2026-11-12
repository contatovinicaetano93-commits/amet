import { AcademicoCard, AcademicoChrome } from "@/components/admin/AcademicoChrome";
import { AcademicoStudentForm } from "@/components/admin/AcademicoStudentForm";
import { createStudent } from "@/lib/academico/actions";

export default async function NewStudentPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const query = await searchParams;
  return (
    <AcademicoChrome
      title="Novo cadastro"
      description="Aluno de pós ou residente. A senha fica guardada para a sala de aula, que entra numa etapa seguinte."
      erro={query.erro}
    >
      <AcademicoCard>
        <AcademicoStudentForm action={createStudent} />
      </AcademicoCard>
    </AcademicoChrome>
  );
}
