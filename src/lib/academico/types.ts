export type Modality = "pos" | "residencia";
export type StudentKind = "aluno" | "residente";
export type RecordStatus = "ativo" | "inativo";
export type Sex = "Feminino" | "Masculino";
export type DocType = "identidade" | "endereco" | "casamento" | "diploma";
export type DocStatus = "nao_enviado" | "pendente" | "aprovado" | "recusado";
export type CertificateStatus = "aguardando" | "analise" | "indeferido" | "deferido";
export type ClassStatus = "agendada" | "realizada" | "cancelada";

export type Student = {
  id: string;
  kind: StudentKind;
  matricula: string;
  nome: string;
  cpf: string;
  rg: string;
  email: string;
  senha: string;
  nascimento: string;
  sexo: Sex;
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
  status: RecordStatus;
  criadoEm: string;
};

export type Course = {
  id: string;
  codigo: string;
  titulo: string;
  area: string;
  cargaHoraria: number;
  modalidade: Modality;
  status: RecordStatus;
  disciplinaIds: string[];
};

export type Discipline = {
  id: string;
  titulo: string;
  horas: number;
};

export type Enrollment = {
  id: string;
  studentId: string;
  courseId: string;
  plano: string;
  inicio: string;
  status: RecordStatus;
  registro: string;
  valorTotal: number;
  parcelas: number;
  valorMensalidade: number;
  parcelasPagas: number;
  notaFinal: number | null;
  dataEncerramento: string | null;
  tccTema: string;
  tccCarga: number | null;
  tccFormato: string;
};

export type Grade = {
  enrollmentId: string;
  disciplineId: string;
  nota: number | null;
};

export type StudentDocument = {
  id: string;
  studentId: string;
  tipo: DocType;
  status: DocStatus;
  observacao: string;
};

export type CertificateRequest = {
  id: string;
  enrollmentId: string;
  solicitadoEm: string;
  status: CertificateStatus;
  observacao: string;
};

export type Professor = {
  id: string;
  nome: string;
};

export type OnlineClass = {
  id: string;
  courseId: string;
  professorId: string;
  titulo: string;
  data: string;
  inicio: string;
  fim: string;
  meetUrl: string;
  observacao: string;
  status: ClassStatus;
  criadoEm: string;
};

export type AcademicoDb = {
  schemaVersion: number;
  students: Student[];
  courses: Course[];
  disciplines: Discipline[];
  enrollments: Enrollment[];
  grades: Grade[];
  documents: StudentDocument[];
  certificates: CertificateRequest[];
  professors: Professor[];
  onlineClasses: OnlineClass[];
};
