import { AcademicoCard, AcademicoChrome } from "@/components/admin/AcademicoChrome";
import { dashboardStats } from "@/lib/academico/rules";
import { readAcademico } from "@/lib/academico/store";

export default async function AcademicoHomePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const query = await searchParams;
  const db = await readAcademico();
  const today = new Date().toISOString().slice(0, 10);
  const stats = dashboardStats(db, today);
  const cards = [
    ["Alunos de pós ativos", stats.alunosAtivos],
    ["Residentes ativos", stats.residentesAtivos],
    ["Inscrições de pós", stats.posAtivas],
    ["Inscrições de residência", stats.residenciasAtivas],
    ["Inscrições neste mês", stats.inscricoesNoMes],
    ["Concluintes", stats.concluintes],
    ["Certificados na fila", stats.certificadosPendentes],
    ["Aulas agendadas", stats.aulasAgendadas],
  ] as const;

  return (
    <AcademicoChrome
      title="Acadêmico"
      description="Pós-graduação, residência, documentos, financeiro e aulas online. Os dados ficam no mesmo banco do site, separados das candidaturas de estágio."
      ok={query.ok}
      erro={query.erro}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <AcademicoCard key={label}>
            <p className="text-sm text-amet-indigo/70">{label}</p>
            <p className="mt-2 text-3xl font-bold text-amet-indigo">{value}</p>
          </AcademicoCard>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href="/admin/academico/alunos" className="rounded-full bg-amet-blue px-5 py-2.5 text-sm font-semibold text-white">
          Alunos e residentes
        </a>
        <a href="/admin/academico/cursos" className="rounded-full border border-amet-blue/20 px-5 py-2.5 text-sm font-semibold text-amet-blue">
          Cursos
        </a>
        <a href="/admin/academico/aulas" className="rounded-full border border-amet-blue/20 px-5 py-2.5 text-sm font-semibold text-amet-blue">
          Aulas online
        </a>
      </div>
    </AcademicoChrome>
  );
}
