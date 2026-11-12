"use server";

import { redirect } from "next/navigation";

import {
  certificateBlockReason,
  digits,
  meetUrlError,
  modalityForKind,
  validateStudent,
  type StudentInput,
} from "@/lib/academico/rules";
import { readAcademico, updateAcademico } from "@/lib/academico/store";
import type {
  CertificateStatus,
  ClassStatus,
  Course,
  DocStatus,
  DocType,
  Enrollment,
  Sex,
  Student,
  StudentKind,
} from "@/lib/academico/types";
import { hasAdminSession } from "@/lib/adminSession";

function go(path: string, ok?: string, erro?: string): never {
  const params = new URLSearchParams();
  if (ok) params.set("ok", ok);
  if (erro) params.set("erro", erro);
  const query = params.toString();
  redirect(query ? `${path}?${query}` : path);
}

async function requireAdmin() {
  if (!(await hasAdminSession())) redirect("/admin");
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function studentInput(formData: FormData): StudentInput {
  const kind: StudentKind = text(formData, "kind") === "residente" ? "residente" : "aluno";
  return {
    kind,
    matricula: text(formData, "matricula"),
    nome: text(formData, "nome"),
    cpf: digits(text(formData, "cpf")),
    rg: text(formData, "rg"),
    email: text(formData, "email").toLowerCase(),
    senha: text(formData, "senha"),
    nascimento: text(formData, "nascimento"),
    sexo: text(formData, "sexo"),
    faculdade: text(formData, "faculdade"),
    semestre: text(formData, "semestre"),
    campus: text(formData, "campus"),
    cep: digits(text(formData, "cep")),
    estado: text(formData, "estado"),
    cidade: text(formData, "cidade"),
    endereco: text(formData, "endereco"),
    numero: text(formData, "numero"),
    bairro: text(formData, "bairro"),
    complemento: text(formData, "complemento"),
    naturalidade: text(formData, "naturalidade"),
    nacionalidade: text(formData, "nacionalidade"),
    celular: digits(text(formData, "celular")),
    celular2: digits(text(formData, "celular2")),
    telefone: digits(text(formData, "telefone")),
  };
}

function applyStudent(student: Student, input: StudentInput, senha: string) {
  const sexo: Sex = input.sexo === "Masculino" ? "Masculino" : "Feminino";
  student.kind = input.kind;
  student.matricula = input.matricula;
  student.nome = input.nome;
  student.cpf = input.cpf;
  student.rg = input.rg;
  student.email = input.email;
  student.senha = senha;
  student.nascimento = input.nascimento;
  student.sexo = sexo;
  student.faculdade = input.faculdade;
  student.semestre = input.semestre;
  student.campus = input.campus;
  student.cep = input.cep;
  student.estado = input.estado;
  student.cidade = input.cidade;
  student.endereco = input.endereco;
  student.numero = input.numero;
  student.bairro = input.bairro;
  student.complemento = input.complemento;
  student.naturalidade = input.naturalidade;
  student.nacionalidade = input.nacionalidade;
  student.celular = input.celular;
  student.celular2 = input.celular2;
  student.telefone = input.telefone;
}

export async function createStudent(formData: FormData) {
  await requireAdmin();
  const input = studentInput(formData);
  const problem = validateStudent(input, true);
  if (problem) go("/admin/academico/alunos/novo", undefined, problem);
  const today = new Date().toISOString().slice(0, 10);
  let createdId = "";
  const error = await updateAcademico((db) => {
    if (!input.matricula) input.matricula = `${today.slice(0, 4)}${String(db.students.length + 1).padStart(4, "0")}`;
    if (db.students.some((student) => student.matricula === input.matricula)) return "Já existe um cadastro com esta matrícula.";
    if (db.students.some((student) => student.cpf === input.cpf)) return "Já existe um cadastro com este CPF.";
    if (db.students.some((student) => student.email === input.email)) return "Já existe um cadastro com este e-mail.";
    createdId = crypto.randomUUID();
    const student: Student = {
      id: createdId,
      kind: input.kind,
      matricula: input.matricula,
      nome: "",
      cpf: "",
      rg: "",
      email: "",
      senha: "",
      nascimento: "",
      sexo: "Feminino",
      faculdade: "",
      semestre: "",
      campus: "",
      cep: "",
      estado: "",
      cidade: "",
      endereco: "",
      numero: "",
      bairro: "",
      complemento: "",
      naturalidade: "",
      nacionalidade: "",
      celular: "",
      celular2: "",
      telefone: "",
      status: "ativo",
      criadoEm: today,
    };
    applyStudent(student, input, input.senha);
    db.students.unshift(student);
    const types: DocType[] = ["identidade", "endereco", "casamento", "diploma"];
    for (const tipo of types) {
      db.documents.push({ id: `${createdId}-${tipo}`, studentId: createdId, tipo, status: "nao_enviado", observacao: "" });
    }
    return null;
  });
  if (error) go("/admin/academico/alunos/novo", undefined, error);
  go(`/admin/academico/alunos/${createdId}`, "Cadastro criado.");
}

export async function updateStudent(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const input = studentInput(formData);
  const current = (await readAcademico()).students.find((student) => student.id === id);
  if (!current) go("/admin/academico/alunos", undefined, "Cadastro não encontrado.");
  const problem = validateStudent({ ...input, senha: input.senha || current.senha }, false);
  if (problem) go(`/admin/academico/alunos/${id}`, undefined, problem);
  const error = await updateAcademico((db) => {
    const student = db.students.find((item) => item.id === id);
    if (!student) return "Cadastro não encontrado.";
    if (db.students.some((item) => item.id !== id && item.matricula === input.matricula)) return "Já existe um cadastro com esta matrícula.";
    if (db.students.some((item) => item.id !== id && item.cpf === input.cpf)) return "Já existe um cadastro com este CPF.";
    if (db.students.some((item) => item.id !== id && item.email === input.email)) return "Já existe um cadastro com este e-mail.";
    applyStudent(student, input, input.senha || student.senha);
    student.status = text(formData, "status") === "inativo" ? "inativo" : "ativo";
    return null;
  });
  if (error) go(`/admin/academico/alunos/${id}`, undefined, error);
  go(`/admin/academico/alunos/${id}`, "Cadastro atualizado.");
}

export async function createCourse(formData: FormData) {
  await requireAdmin();
  const titulo = text(formData, "titulo");
  const area = text(formData, "area");
  const carga = Number(text(formData, "cargaHoraria"));
  const modalidade = text(formData, "modalidade") === "residencia" ? "residencia" : "pos";
  const codigo = text(formData, "codigo").toUpperCase();
  if (titulo.length < 4) go("/admin/academico/cursos/novo", undefined, "Informe o título do curso.");
  if (area.length < 3) go("/admin/academico/cursos/novo", undefined, "Informe a área de conhecimento.");
  if (!Number.isFinite(carga) || carga <= 0) go("/admin/academico/cursos/novo", undefined, "Informe a carga horária.");
  if (codigo.length < 3) go("/admin/academico/cursos/novo", undefined, "Informe um código com pelo menos 3 caracteres.");
  const error = await updateAcademico((db) => {
    if (db.courses.some((course) => course.codigo.toLowerCase() === codigo.toLowerCase())) return "Já existe um curso com este código.";
    const course: Course = {
      id: crypto.randomUUID(),
      codigo,
      titulo,
      area,
      cargaHoraria: carga,
      modalidade,
      status: "ativo",
      disciplinaIds: [],
    };
    db.courses.unshift(course);
    return null;
  });
  if (error) go("/admin/academico/cursos/novo", undefined, error);
  go("/admin/academico/cursos", "Curso criado.");
}

export async function addDiscipline(formData: FormData) {
  await requireAdmin();
  const courseId = text(formData, "courseId");
  const titulo = text(formData, "titulo");
  const horas = Number(text(formData, "horas"));
  const back = `/admin/academico/cursos/${courseId}`;
  if (titulo.length < 3) go(back, undefined, "Informe o nome da disciplina.");
  if (!Number.isFinite(horas) || horas <= 0) go(back, undefined, "Informe a carga horária da disciplina.");
  const error = await updateAcademico((db) => {
    const course = db.courses.find((item) => item.id === courseId);
    if (!course) return "Curso não encontrado.";
    const discipline = { id: crypto.randomUUID(), titulo, horas };
    db.disciplines.push(discipline);
    course.disciplinaIds.push(discipline.id);
    for (const enrollment of db.enrollments.filter((item) => item.courseId === courseId)) {
      db.grades.push({ enrollmentId: enrollment.id, disciplineId: discipline.id, nota: null });
    }
    return null;
  });
  if (error) go(back, undefined, error);
  go(back, "Disciplina incluída.");
}

export async function createEnrollment(formData: FormData) {
  await requireAdmin();
  const studentId = text(formData, "studentId");
  const courseId = text(formData, "courseId");
  const plano = text(formData, "plano");
  const inicio = text(formData, "inicio");
  const valorTotal = Number(text(formData, "valorTotal").replace(/\./g, "").replace(",", "."));
  const parcelas = Number(text(formData, "parcelas"));
  const back = `/admin/academico/alunos/${studentId}?aba=academico`;
  if (!courseId) go(back, undefined, "Selecione o curso.");
  if (!inicio) go(back, undefined, "Informe a data de início.");
  if (!plano) go(back, undefined, "Selecione o plano.");
  if (!Number.isFinite(parcelas) || parcelas < 1) go(back, undefined, "Informe a quantidade de parcelas.");
  if (!Number.isFinite(valorTotal) || valorTotal < 0) go(back, undefined, "Informe o valor total.");
  const today = new Date().toISOString().slice(0, 10);
  const error = await updateAcademico((db) => {
    const student = db.students.find((item) => item.id === studentId);
    const course = db.courses.find((item) => item.id === courseId && item.status === "ativo");
    if (!student || !course) return "Aluno ou curso não encontrado.";
    if (course.modalidade !== modalityForKind(student.kind)) {
      return student.kind === "aluno" ? "Aluno de pós só se matricula em pós-graduação." : "Residente só se matricula em residência.";
    }
    if (db.enrollments.some((item) => item.studentId === studentId && item.courseId === courseId && item.status === "ativo")) {
      return "Já existe uma inscrição ativa neste curso.";
    }
    const enrollment: Enrollment = {
      id: crypto.randomUUID(),
      studentId,
      courseId,
      plano,
      inicio,
      status: "ativo",
      registro: today,
      valorTotal,
      parcelas,
      valorMensalidade: Number((valorTotal / parcelas).toFixed(2)),
      parcelasPagas: 0,
      notaFinal: null,
      dataEncerramento: null,
      tccTema: "",
      tccCarga: null,
      tccFormato: "",
    };
    db.enrollments.unshift(enrollment);
    for (const disciplineId of course.disciplinaIds) {
      db.grades.push({ enrollmentId: enrollment.id, disciplineId, nota: null });
    }
    return null;
  });
  if (error) go(back, undefined, error);
  go(back, "Inscrição criada.");
}

export async function registerPayment(formData: FormData) {
  await requireAdmin();
  const enrollmentId = text(formData, "enrollmentId");
  const studentId = text(formData, "studentId");
  const back = `/admin/academico/alunos/${studentId}?aba=financeiro`;
  const error = await updateAcademico((db) => {
    const enrollment = db.enrollments.find((item) => item.id === enrollmentId);
    if (!enrollment) return "Inscrição não encontrada.";
    if (enrollment.parcelasPagas >= enrollment.parcelas) return "Todas as parcelas já foram registradas.";
    enrollment.parcelasPagas += 1;
    return null;
  });
  if (error) go(back, undefined, error);
  go(back, "Parcela registrada.");
}

export async function saveClosing(formData: FormData) {
  await requireAdmin();
  const enrollmentId = text(formData, "enrollmentId");
  const studentId = text(formData, "studentId");
  const back = `/admin/academico/alunos/${studentId}?aba=academico`;
  const notaRaw = text(formData, "notaFinal");
  const notaFinal = notaRaw ? Number(notaRaw.replace(",", ".")) : null;
  const dataEncerramento = text(formData, "dataEncerramento") || null;
  if (notaFinal !== null && (!Number.isFinite(notaFinal) || notaFinal < 0 || notaFinal > 100)) {
    go(back, undefined, "A nota final precisa ficar entre 0 e 100.");
  }
  const tccTema = text(formData, "tccTema");
  const tccFormato = text(formData, "tccFormato");
  const cargaRaw = text(formData, "tccCarga");
  const tccCarga = cargaRaw ? Number(cargaRaw) : null;
  if (tccCarga !== null && (!Number.isFinite(tccCarga) || tccCarga < 0)) go(back, undefined, "A carga horária do TCC precisa ser um número.");
  const error = await updateAcademico((db) => {
    const enrollment = db.enrollments.find((item) => item.id === enrollmentId);
    const course = enrollment ? db.courses.find((item) => item.id === enrollment.courseId) : undefined;
    if (!enrollment || !course) return "Inscrição não encontrada.";
    enrollment.notaFinal = notaFinal;
    enrollment.dataEncerramento = dataEncerramento;
    if (course.modalidade === "pos") {
      enrollment.tccTema = tccTema;
      enrollment.tccFormato = tccFormato;
      enrollment.tccCarga = tccCarga;
    }
    return null;
  });
  if (error) go(back, undefined, error);
  go(back, "Encerramento salvo.");
}

export async function updateDocument(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const studentId = text(formData, "studentId");
  const status = text(formData, "status");
  const allowed: DocStatus[] = ["nao_enviado", "pendente", "aprovado", "recusado"];
  const next = allowed.find((item) => item === status) ?? "pendente";
  await updateAcademico((db) => {
    const doc = db.documents.find((item) => item.id === id && item.studentId === studentId);
    if (!doc) return;
    doc.status = next;
    doc.observacao = text(formData, "observacao");
  });
  go(`/admin/academico/alunos/${studentId}?aba=documentos`, "Documento atualizado.");
}

export async function requestCertificate(formData: FormData) {
  await requireAdmin();
  const enrollmentId = text(formData, "enrollmentId");
  const studentId = text(formData, "studentId");
  const back = `/admin/academico/alunos/${studentId}?aba=certificado`;
  const db = await readAcademico();
  const enrollment = db.enrollments.find((item) => item.id === enrollmentId);
  const course = enrollment ? db.courses.find((item) => item.id === enrollment.courseId) : undefined;
  if (!enrollment || !course) go(back, undefined, "Inscrição não encontrada.");
  const reason = certificateBlockReason({
    modality: course.modalidade,
    docs: db.documents.filter((item) => item.studentId === studentId),
    notaFinal: enrollment.notaFinal,
    dataEncerramento: enrollment.dataEncerramento,
    existing: db.certificates.find((item) => item.enrollmentId === enrollmentId && item.status !== "indeferido") ?? null,
  });
  if (reason) go(back, undefined, reason);
  await updateAcademico((database) => {
    database.certificates.unshift({
      id: crypto.randomUUID(),
      enrollmentId,
      solicitadoEm: new Date().toISOString().slice(0, 10),
      status: "aguardando",
      observacao: "",
    });
  });
  go(back, "Certificado entrou na fila.");
}

export async function updateCertificate(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const studentId = text(formData, "studentId");
  const status = text(formData, "status");
  const allowed: CertificateStatus[] = ["aguardando", "analise", "indeferido", "deferido"];
  const next = allowed.find((item) => item === status) ?? "analise";
  await updateAcademico((db) => {
    const certificate = db.certificates.find((item) => item.id === id);
    if (!certificate) return;
    certificate.status = next;
    certificate.observacao = text(formData, "observacao");
  });
  go(`/admin/academico/alunos/${studentId}?aba=certificado`, "Fila do certificado atualizada.");
}

export async function createProfessor(formData: FormData) {
  await requireAdmin();
  const nome = text(formData, "nome");
  if (nome.length < 5) go("/admin/academico/aulas", undefined, "Informe o nome do professor.");
  await updateAcademico((db) => {
    db.professors.unshift({ id: crypto.randomUUID(), nome });
  });
  go("/admin/academico/aulas", "Professor incluído.");
}

function classStatus(value: string): ClassStatus {
  switch (value) {
    case "realizada":
    case "cancelada":
    case "agendada":
      return value;
    default:
      return "agendada";
  }
}

export async function createOnlineClass(formData: FormData) {
  await requireAdmin();
  const titulo = text(formData, "titulo");
  const courseId = text(formData, "courseId");
  const professorId = text(formData, "professorId");
  const data = text(formData, "data");
  const inicio = text(formData, "inicio");
  const fim = text(formData, "fim");
  const meetUrl = text(formData, "meetUrl");
  const observacao = text(formData, "observacao");
  if (titulo.length < 3) go("/admin/academico/aulas/nova", undefined, "Informe o título da aula.");
  if (!data || !inicio || !fim) go("/admin/academico/aulas/nova", undefined, "Informe data e horário.");
  if (fim <= inicio) go("/admin/academico/aulas/nova", undefined, "O horário final precisa ser depois do início.");
  const linkError = meetUrlError(meetUrl);
  if (linkError) go("/admin/academico/aulas/nova", undefined, linkError);
  const error = await updateAcademico((db) => {
    if (!db.courses.some((course) => course.id === courseId)) return "Curso não encontrado.";
    if (!db.professors.some((professor) => professor.id === professorId)) return "Professor não encontrado.";
    db.onlineClasses.unshift({
      id: crypto.randomUUID(),
      courseId,
      professorId,
      titulo,
      data,
      inicio,
      fim,
      meetUrl,
      observacao,
      status: "agendada",
      criadoEm: new Date().toISOString().slice(0, 10),
    });
    return null;
  });
  if (error) go("/admin/academico/aulas/nova", undefined, error);
  go("/admin/academico/aulas", "Aula cadastrada. O professor entra pelo link, sem a senha do Google.");
}

export async function updateClassStatus(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const status = classStatus(text(formData, "status"));
  await updateAcademico((db) => {
    const item = db.onlineClasses.find((klass) => klass.id === id);
    if (item) item.status = status;
  });
  go("/admin/academico/aulas", "Status da aula atualizado.");
}
