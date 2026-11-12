import { notFound } from "next/navigation";

import { AcademicoCard, AcademicoChrome, academicoFieldClass } from "@/components/admin/AcademicoChrome";
import { AcademicoStudentForm } from "@/components/admin/AcademicoStudentForm";
import {
  createEnrollment,
  registerPayment,
  requestCertificate,
  saveClosing,
  updateCertificate,
  updateDocument,
  updateStudent,
} from "@/lib/academico/actions";
import {
  DOC_LABEL,
  DOC_TYPES,
  certificateBlockReason,
  certificateStatusLabel,
  docStatusLabel,
  formatDate,
  kindLabel,
  modalityLabel,
  money,
  openAmount,
  receivedAmount,
} from "@/lib/academico/rules";
import { readAcademico } from "@/lib/academico/store";
import type { DocStatus } from "@/lib/academico/types";

const TABS = [
  { id: "cadastro", label: "Cadastro" },
  { id: "academico", label: "Acadêmico" },
  { id: "documentos", label: "Documentos" },
  { id: "financeiro", label: "Financeiro" },
  { id: "certificado", label: "Certificado" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function tabFrom(value: string | undefined): TabId {
  return TABS.some((item) => item.id === value) ? (value as TabId) : "cadastro";
}

export default async function StudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string; ok?: string; erro?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const aba = tabFrom(query.aba);
  const db = await readAcademico();
  const student = db.students.find((item) => item.id === id);
  if (!student) notFound();
  const enrollments = db.enrollments.filter((item) => item.studentId === student.id);
  const docs = db.documents.filter((item) => item.studentId === student.id);
  const courses = db.courses.filter((course) => course.status === "ativo" && course.modalidade === (student.kind === "aluno" ? "pos" : "residencia"));

  return (
    <AcademicoChrome
      title={student.nome}
      description={`${kindLabel(student.kind)} · ${student.matricula} · ${student.faculdade}`}
      ok={query.ok}
      erro={query.erro}
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <a
            key={tab.id}
            href={`/admin/academico/alunos/${student.id}?aba=${tab.id}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${aba === tab.id ? "bg-amet-blue text-white" : "bg-white text-amet-indigo ring-1 ring-amet-blue/15"}`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {aba === "cadastro" ? (
        <AcademicoCard>
          <AcademicoStudentForm action={updateStudent} student={{ ...student, senha: "" }} />
        </AcademicoCard>
      ) : null}

      {aba === "academico" ? (
        <div className="grid gap-4">
          <AcademicoCard>
            <h2 className="font-semibold text-amet-indigo">Nova inscrição</h2>
            <form action={createEnrollment} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="studentId" value={student.id} />
              <label className="block text-sm font-medium text-amet-indigo sm:col-span-2">
                Curso
                <select className={academicoFieldClass} name="courseId" defaultValue="">
                  <option value="">Selecione</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.titulo}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-amet-indigo">
                Plano
                <select className={academicoFieldClass} name="plano" defaultValue="mensal">
                  <option value="mensal">Mensal</option>
                  <option value="semestral">Semestral</option>
                  <option value="avista">À vista</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-amet-indigo">
                Início
                <input className={academicoFieldClass} name="inicio" type="date" required />
              </label>
              <label className="block text-sm font-medium text-amet-indigo">
                Valor total
                <input className={academicoFieldClass} name="valorTotal" inputMode="decimal" required />
              </label>
              <label className="block text-sm font-medium text-amet-indigo">
                Parcelas
                <input className={academicoFieldClass} name="parcelas" type="number" min={1} required />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className="rounded-full bg-amet-blue px-5 py-2.5 text-sm font-semibold text-white">
                  Criar inscrição
                </button>
              </div>
            </form>
          </AcademicoCard>
          {enrollments.map((enrollment) => {
            const course = db.courses.find((item) => item.id === enrollment.courseId);
            return (
              <AcademicoCard key={enrollment.id}>
                <h2 className="font-semibold text-amet-indigo">{course?.titulo ?? "Curso"}</h2>
                <p className="mt-1 text-sm text-amet-indigo/70">
                  {course ? modalityLabel(course.modalidade) : ""} · início {formatDate(enrollment.inicio)} · {enrollment.status}
                </p>
                <form action={saveClosing} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="enrollmentId" value={enrollment.id} />
                  <input type="hidden" name="studentId" value={student.id} />
                  <label className="block text-sm font-medium text-amet-indigo">
                    Nota final
                    <input className={academicoFieldClass} name="notaFinal" defaultValue={enrollment.notaFinal ?? ""} />
                  </label>
                  <label className="block text-sm font-medium text-amet-indigo">
                    Encerramento
                    <input className={academicoFieldClass} name="dataEncerramento" type="date" defaultValue={enrollment.dataEncerramento ?? ""} />
                  </label>
                  {course?.modalidade === "pos" ? (
                    <>
                      <label className="block text-sm font-medium text-amet-indigo sm:col-span-2">
                        Tema do TCC
                        <input className={academicoFieldClass} name="tccTema" defaultValue={enrollment.tccTema} />
                      </label>
                      <label className="block text-sm font-medium text-amet-indigo">
                        Formato do TCC
                        <input className={academicoFieldClass} name="tccFormato" defaultValue={enrollment.tccFormato} />
                      </label>
                      <label className="block text-sm font-medium text-amet-indigo">
                        Carga do TCC
                        <input className={academicoFieldClass} name="tccCarga" defaultValue={enrollment.tccCarga ?? ""} />
                      </label>
                    </>
                  ) : null}
                  <div className="sm:col-span-2">
                    <button type="submit" className="rounded-full border border-amet-blue/20 px-5 py-2.5 text-sm font-semibold text-amet-blue">
                      Salvar encerramento
                    </button>
                  </div>
                </form>
              </AcademicoCard>
            );
          })}
        </div>
      ) : null}

      {aba === "documentos" ? (
        <div className="grid gap-3">
          {DOC_TYPES.map((tipo) => {
            const doc = docs.find((item) => item.tipo === tipo);
            if (!doc) return null;
            return (
              <AcademicoCard key={doc.id}>
                <form action={updateDocument} className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                  <input type="hidden" name="id" value={doc.id} />
                  <input type="hidden" name="studentId" value={student.id} />
                  <div>
                    <p className="font-semibold text-amet-indigo">{DOC_LABEL[tipo]}</p>
                    <p className="text-sm text-amet-indigo/70">{docStatusLabel(doc.status)}</p>
                    <input className={academicoFieldClass} name="observacao" defaultValue={doc.observacao} placeholder="Observação" />
                  </div>
                  <select className={academicoFieldClass} name="status" defaultValue={doc.status}>
                    {(["nao_enviado", "pendente", "aprovado", "recusado"] as DocStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {docStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-full bg-amet-blue px-4 py-2.5 text-sm font-semibold text-white">
                    Salvar
                  </button>
                </form>
              </AcademicoCard>
            );
          })}
        </div>
      ) : null}

      {aba === "financeiro" ? (
        <div className="grid gap-3">
          {enrollments.length === 0 ? <p className="text-sm text-amet-indigo/70">Nenhuma inscrição para controlar.</p> : null}
          {enrollments.map((enrollment) => {
            const course = db.courses.find((item) => item.id === enrollment.courseId);
            return (
              <AcademicoCard key={enrollment.id}>
                <h2 className="font-semibold text-amet-indigo">{course?.titulo ?? "Curso"}</h2>
                <p className="mt-2 text-sm text-amet-indigo/80">
                  Total {money(enrollment.valorTotal)} · recebido {money(receivedAmount(enrollment))} · em aberto {money(openAmount(enrollment))}
                </p>
                <p className="mt-1 text-sm text-amet-indigo/70">
                  {enrollment.parcelasPagas} de {enrollment.parcelas} parcelas
                </p>
                <form action={registerPayment} className="mt-4">
                  <input type="hidden" name="enrollmentId" value={enrollment.id} />
                  <input type="hidden" name="studentId" value={student.id} />
                  <button type="submit" className="rounded-full bg-amet-blue px-5 py-2.5 text-sm font-semibold text-white">
                    Registrar parcela recebida
                  </button>
                </form>
              </AcademicoCard>
            );
          })}
        </div>
      ) : null}

      {aba === "certificado" ? (
        <div className="grid gap-3">
          {enrollments.map((enrollment) => {
            const course = db.courses.find((item) => item.id === enrollment.courseId);
            const existing = db.certificates.find((item) => item.enrollmentId === enrollment.id);
            const reason = course
              ? certificateBlockReason({
                  modality: course.modalidade,
                  docs,
                  notaFinal: enrollment.notaFinal,
                  dataEncerramento: enrollment.dataEncerramento,
                  existing: existing && existing.status !== "indeferido" ? existing : null,
                })
              : "Curso não encontrado.";
            return (
              <AcademicoCard key={enrollment.id}>
                <h2 className="font-semibold text-amet-indigo">{course?.titulo ?? "Curso"}</h2>
                {existing ? (
                  <form action={updateCertificate} className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
                    <input type="hidden" name="id" value={existing.id} />
                    <input type="hidden" name="studentId" value={student.id} />
                    <label className="block text-sm font-medium text-amet-indigo">
                      Fila
                      <select className={academicoFieldClass} name="status" defaultValue={existing.status}>
                        <option value="aguardando">{certificateStatusLabel("aguardando")}</option>
                        <option value="analise">{certificateStatusLabel("analise")}</option>
                        <option value="indeferido">{certificateStatusLabel("indeferido")}</option>
                        <option value="deferido">{certificateStatusLabel("deferido")}</option>
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-amet-indigo">
                      Observação
                      <input className={academicoFieldClass} name="observacao" defaultValue={existing.observacao} />
                    </label>
                    <button type="submit" className="rounded-full bg-amet-blue px-4 py-2.5 text-sm font-semibold text-white">
                      Atualizar
                    </button>
                  </form>
                ) : (
                  <form action={requestCertificate} className="mt-4">
                    <input type="hidden" name="enrollmentId" value={enrollment.id} />
                    <input type="hidden" name="studentId" value={student.id} />
                    <p className="mb-3 text-sm text-amet-indigo/70">{reason ?? "Documentos, nota e encerramento estão prontos."}</p>
                    <button type="submit" className="rounded-full bg-amet-blue px-5 py-2.5 text-sm font-semibold text-white" disabled={Boolean(reason)}>
                      Pedir certificado
                    </button>
                  </form>
                )}
              </AcademicoCard>
            );
          })}
        </div>
      ) : null}
    </AcademicoChrome>
  );
}
