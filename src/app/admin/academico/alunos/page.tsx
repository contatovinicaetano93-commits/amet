import { AcademicoChrome } from "@/components/admin/AcademicoChrome";
import { formatCpf, kindLabel } from "@/lib/academico/rules";
import { readAcademico } from "@/lib/academico/store";

export default async function AcademicoStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string; q?: string }>;
}) {
  const query = await searchParams;
  const db = await readAcademico();
  const q = query.q?.trim().toLowerCase() ?? "";
  const digits = q.replace(/\D/g, "");
  const rows = db.students.filter((student) => {
    if (!q) return true;
    const hay = `${student.nome} ${student.email} ${student.matricula} ${student.cpf}`.toLowerCase();
    return hay.includes(q) || (digits.length > 0 && student.cpf.includes(digits));
  });

  return (
    <AcademicoChrome
      title="Alunos e residentes"
      description="A residência é o cadastro de estagiário, com semestre e campus. Todo mundo leva a faculdade de origem."
      ok={query.ok}
      erro={query.erro}
      action={
        <a href="/admin/academico/alunos/novo" className="rounded-full bg-amet-blue px-5 py-2.5 text-sm font-semibold text-white">
          Novo cadastro
        </a>
      }
    >
      <form className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Nome, CPF, e-mail ou matrícula"
          className="w-full rounded-xl border border-amet-blue/20 px-4 py-2.5 text-sm text-amet-indigo outline-none focus:border-amet-blue"
        />
        <button type="submit" className="rounded-full border border-amet-blue/20 px-4 text-sm font-semibold text-amet-blue">
          Buscar
        </button>
      </form>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-amet-blue/20 px-4 py-8 text-sm text-amet-indigo/70">
          Nenhum cadastro ainda. Comece por um aluno de pós ou por um residente.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-amet-blue/15 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-amet-blue/10 text-amet-indigo/60">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">CPF</th>
                <th className="px-4 py-3 font-medium">Matrícula</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((student) => (
                <tr key={student.id} className="border-b border-amet-blue/10 last:border-0">
                  <td className="px-4 py-3">
                    <a href={`/admin/academico/alunos/${student.id}`} className="font-semibold text-amet-blue">
                      {student.nome}
                    </a>
                    <span className="mt-0.5 block text-xs text-amet-indigo/60">{student.status === "ativo" ? "Ativo" : "Inativo"}</span>
                  </td>
                  <td className="px-4 py-3">{kindLabel(student.kind)}</td>
                  <td className="px-4 py-3">{formatCpf(student.cpf)}</td>
                  <td className="px-4 py-3">{student.matricula}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AcademicoChrome>
  );
}
