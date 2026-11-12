import { academicoFieldClass } from "@/components/admin/AcademicoChrome";
import type { Student } from "@/lib/academico/types";

export function AcademicoStudentForm({
  action,
  student,
}: {
  action: (formData: FormData) => Promise<void>;
  student?: Student;
}) {
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {student ? <input type="hidden" name="id" value={student.id} /> : null}
      <label className="block text-sm font-medium text-amet-indigo">
        Tipo
        <select className={academicoFieldClass} name="kind" defaultValue={student?.kind ?? "aluno"}>
          <option value="aluno">Aluno de pós</option>
          <option value="residente">Residente</option>
        </select>
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        Matrícula
        <input className={academicoFieldClass} name="matricula" defaultValue={student?.matricula ?? ""} placeholder="Gerada se ficar em branco" />
      </label>
      <label className="block text-sm font-medium text-amet-indigo sm:col-span-2">
        Nome completo
        <input className={academicoFieldClass} name="nome" required defaultValue={student?.nome ?? ""} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        CPF
        <input className={academicoFieldClass} name="cpf" required defaultValue={student?.cpf ?? ""} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        RG
        <input className={academicoFieldClass} name="rg" defaultValue={student?.rg ?? ""} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        E-mail
        <input className={academicoFieldClass} name="email" type="email" required defaultValue={student?.email ?? ""} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        Senha da sala de aula
        <input className={academicoFieldClass} name="senha" type="password" autoComplete="new-password" placeholder={student ? "Em branco mantém a atual" : "Mínimo de 6 caracteres"} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        Nascimento
        <input className={academicoFieldClass} name="nascimento" type="date" required defaultValue={student?.nascimento ?? ""} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        Sexo
        <select className={academicoFieldClass} name="sexo" defaultValue={student?.sexo ?? "Feminino"}>
          <option value="Feminino">Feminino</option>
          <option value="Masculino">Masculino</option>
        </select>
      </label>
      <label className="block text-sm font-medium text-amet-indigo sm:col-span-2">
        Faculdade de origem
        <input className={academicoFieldClass} name="faculdade" required defaultValue={student?.faculdade ?? ""} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        Semestre
        <input className={academicoFieldClass} name="semestre" defaultValue={student?.semestre ?? ""} placeholder="Obrigatório na residência" />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        Campus
        <input className={academicoFieldClass} name="campus" defaultValue={student?.campus ?? ""} placeholder="Obrigatório na residência" />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        CEP
        <input className={academicoFieldClass} name="cep" required defaultValue={student?.cep ?? ""} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        Estado
        <input className={academicoFieldClass} name="estado" required defaultValue={student?.estado ?? ""} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        Cidade
        <input className={academicoFieldClass} name="cidade" required defaultValue={student?.cidade ?? ""} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        Bairro
        <input className={academicoFieldClass} name="bairro" required defaultValue={student?.bairro ?? ""} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo sm:col-span-2">
        Endereço
        <input className={academicoFieldClass} name="endereco" required defaultValue={student?.endereco ?? ""} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        Número
        <input className={academicoFieldClass} name="numero" required defaultValue={student?.numero ?? ""} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        Complemento
        <input className={academicoFieldClass} name="complemento" defaultValue={student?.complemento ?? ""} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        Naturalidade
        <input className={academicoFieldClass} name="naturalidade" required defaultValue={student?.naturalidade ?? ""} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        Nacionalidade
        <input className={academicoFieldClass} name="nacionalidade" required defaultValue={student?.nacionalidade ?? "Brasileira"} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        Celular
        <input className={academicoFieldClass} name="celular" required defaultValue={student?.celular ?? ""} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        Celular 2
        <input className={academicoFieldClass} name="celular2" defaultValue={student?.celular2 ?? ""} />
      </label>
      <label className="block text-sm font-medium text-amet-indigo">
        Telefone
        <input className={academicoFieldClass} name="telefone" defaultValue={student?.telefone ?? ""} />
      </label>
      {student ? (
        <label className="block text-sm font-medium text-amet-indigo">
          Situação
          <select className={academicoFieldClass} name="status" defaultValue={student.status}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </label>
      ) : null}
      <div className="sm:col-span-2">
        <button type="submit" className="rounded-full bg-amet-blue px-6 py-3 text-sm font-semibold text-white hover:bg-amet-indigo">
          {student ? "Salvar cadastro" : "Criar cadastro"}
        </button>
      </div>
    </form>
  );
}
