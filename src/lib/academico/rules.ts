import type {
  AcademicoDb,
  CertificateRequest,
  CertificateStatus,
  ClassStatus,
  Course,
  DocStatus,
  DocType,
  Enrollment,
  Modality,
  OnlineClass,
  Student,
  StudentDocument,
  StudentKind,
} from "@/lib/academico/types";

export const DOC_LABEL: Record<DocType, string> = {
  identidade: "RG, CPF ou CNH",
  endereco: "Comprovante de endereço",
  casamento: "Certidão de casamento",
  diploma: "Diploma de graduação",
};

export const DOC_TYPES: DocType[] = ["identidade", "endereco", "casamento", "diploma"];

const REQUIRED_DOCS: DocType[] = ["identidade", "endereco", "diploma"];

export function modalityLabel(modality: Modality): string {
  switch (modality) {
    case "pos":
      return "Pós-graduação";
    case "residencia":
      return "Residência";
    default: {
      const unknown: never = modality;
      return unknown;
    }
  }
}

export function kindLabel(kind: StudentKind): string {
  switch (kind) {
    case "aluno":
      return "Aluno de pós";
    case "residente":
      return "Residente";
    default: {
      const unknown: never = kind;
      return unknown;
    }
  }
}

export function docStatusLabel(status: DocStatus): string {
  switch (status) {
    case "nao_enviado":
      return "Não enviado";
    case "pendente":
      return "Em análise";
    case "aprovado":
      return "Aprovado";
    case "recusado":
      return "Recusado";
    default: {
      const unknown: never = status;
      return unknown;
    }
  }
}

export function certificateStatusLabel(status: CertificateStatus): string {
  switch (status) {
    case "aguardando":
      return "Aguardando";
    case "analise":
      return "Em análise";
    case "indeferido":
      return "Indeferido";
    case "deferido":
      return "Deferido";
    default: {
      const unknown: never = status;
      return unknown;
    }
  }
}

export function classStatusLabel(status: ClassStatus): string {
  switch (status) {
    case "agendada":
      return "Agendada";
    case "realizada":
      return "Realizada";
    case "cancelada":
      return "Cancelada";
    default: {
      const unknown: never = status;
      return unknown;
    }
  }
}

export function digits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCpf(value: string): string {
  const cpf = digits(value).slice(0, 11);
  return cpf.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [year, month, day] = iso.slice(0, 10).split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

export function money(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function receivedAmount(enrollment: Enrollment): number {
  return enrollment.parcelasPagas * enrollment.valorMensalidade;
}

export function openAmount(enrollment: Enrollment): number {
  return Math.max(0, enrollment.valorTotal - receivedAmount(enrollment));
}

export function modalityForKind(kind: StudentKind): Modality {
  switch (kind) {
    case "aluno":
      return "pos";
    case "residente":
      return "residencia";
    default: {
      const unknown: never = kind;
      return unknown;
    }
  }
}

export type StudentInput = {
  kind: StudentKind;
  matricula: string;
  nome: string;
  cpf: string;
  rg: string;
  email: string;
  senha: string;
  nascimento: string;
  sexo: string;
  faculdade: string;
  semestre: string;
  campus: string;
  cep: string;
  estado: string;
  cidade: string;
  endereco: string;
  numero: string;
  bairro: string;
  complemento: string;
  naturalidade: string;
  nacionalidade: string;
  celular: string;
  celular2: string;
  telefone: string;
};

export function validateStudent(input: StudentInput, requirePassword: boolean): string | null {
  if (input.nome.trim().length < 5) return "Informe o nome completo.";
  if (digits(input.cpf).length !== 11) return "O CPF precisa ter 11 números.";
  if (!input.email.includes("@") || !input.email.includes(".")) return "Informe um e-mail válido.";
  if (requirePassword && input.senha.trim().length < 6) return "A senha de acesso precisa ter ao menos 6 caracteres.";
  if (!input.nascimento) return "Informe a data de nascimento.";
  if (input.sexo !== "Feminino" && input.sexo !== "Masculino") return "Selecione o sexo.";
  if (input.faculdade.trim().length < 3) return "Informe a faculdade do aluno.";
  if (input.kind === "residente") {
    if (!input.semestre.trim()) return "Informe o semestre da residência.";
    if (input.campus.trim().length < 2) return "Informe o campus.";
  }
  if (digits(input.cep).length !== 8) return "O CEP precisa ter 8 números.";
  if (input.estado.trim().length < 2) return "Informe o estado.";
  if (input.cidade.trim().length < 2) return "Informe a cidade.";
  if (input.endereco.trim().length < 3) return "Informe o endereço.";
  if (!input.numero.trim()) return "Informe o número.";
  if (input.bairro.trim().length < 2) return "Informe o bairro.";
  if (input.naturalidade.trim().length < 2) return "Informe a naturalidade.";
  if (input.nacionalidade.trim().length < 2) return "Informe a nacionalidade.";
  if (digits(input.celular).length < 10) return "Informe o celular com DDD.";
  return null;
}

export function documentsReady(docs: StudentDocument[]): { ok: boolean; message: string } {
  const missing: string[] = [];
  for (const tipo of REQUIRED_DOCS) {
    const doc = docs.find((item) => item.tipo === tipo);
    if (!doc || doc.status !== "aprovado") missing.push(DOC_LABEL[tipo]);
  }
  const marriage = docs.find((item) => item.tipo === "casamento");
  if (marriage && marriage.status !== "nao_enviado" && marriage.status !== "aprovado") {
    missing.push(`${DOC_LABEL.casamento} ainda não aprovada`);
  }
  if (missing.length === 0) return { ok: true, message: "" };
  return { ok: false, message: `Documentos pendentes: ${missing.join(", ")}.` };
}

export function certificateBlockReason(input: {
  modality: Modality;
  docs: StudentDocument[];
  notaFinal: number | null;
  dataEncerramento: string | null;
  existing: CertificateRequest | null;
}): string | null {
  if (input.modality === "residencia") return "Residência e estágio não emitem certificado.";
  if (input.existing && input.existing.status !== "indeferido") {
    return "Esta matrícula já tem um pedido de certificado em andamento ou deferido.";
  }
  if (input.notaFinal === null || !input.dataEncerramento) {
    return "Lance a nota final e a data de encerramento antes de pedir o certificado.";
  }
  const docs = documentsReady(input.docs);
  if (!docs.ok) return docs.message;
  return null;
}

export function meetUrlError(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "Informe o link completo da sala, começando com https://meet.google.com/.";
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "meet.google.com") {
    return "O link precisa ser uma sala https do Google Meet.";
  }
  if (parsed.username || parsed.password) return "Não coloque usuário nem senha no link.";
  if (parsed.pathname === "/" || parsed.pathname.length < 2) return "O link da sala está incompleto.";
  return null;
}

export function dashboardStats(db: AcademicoDb, today: string) {
  const monthPrefix = today.slice(0, 7);
  const activeStudents = db.students.filter((student) => student.status === "ativo");
  const activeEnrollments = db.enrollments.filter((enrollment) => enrollment.status === "ativo");
  const courseOf = (enrollment: Enrollment) => db.courses.find((course) => course.id === enrollment.courseId);
  return {
    alunosAtivos: activeStudents.filter((student) => student.kind === "aluno").length,
    residentesAtivos: activeStudents.filter((student) => student.kind === "residente").length,
    posAtivas: activeEnrollments.filter((enrollment) => courseOf(enrollment)?.modalidade === "pos").length,
    residenciasAtivas: activeEnrollments.filter((enrollment) => courseOf(enrollment)?.modalidade === "residencia").length,
    inscricoesNoMes: db.enrollments.filter((enrollment) => enrollment.registro.startsWith(monthPrefix)).length,
    concluintes: db.enrollments.filter((enrollment) => Boolean(enrollment.dataEncerramento)).length,
    certificadosPendentes: db.certificates.filter(
      (certificate) => certificate.status === "aguardando" || certificate.status === "analise",
    ).length,
    aulasAgendadas: db.onlineClasses.filter((item) => item.status === "agendada").length,
  };
}

export function courseById(db: AcademicoDb, id: string): Course | undefined {
  return db.courses.find((course) => course.id === id);
}

export function sortedClasses(classes: OnlineClass[]): OnlineClass[] {
  return [...classes].sort((a, b) => `${a.data}T${a.inicio}`.localeCompare(`${b.data}T${b.inicio}`));
}

export function isCompletedStudent(student: Student, db: AcademicoDb): boolean {
  return db.enrollments.some((enrollment) => enrollment.studentId === student.id && Boolean(enrollment.dataEncerramento));
}
