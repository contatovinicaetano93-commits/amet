export const DIAS = [
  { code: "seg", label: "Segunda-feira" },
  { code: "ter", label: "Terça-feira" },
  { code: "qua", label: "Quarta-feira" },
  { code: "qui", label: "Quinta-feira" },
  { code: "sab", label: "Sábado" },
] as const;

export type DiaCode = (typeof DIAS)[number]["code"];

export const PERIODOS = [
  { code: "manha", label: "Manhã" },
  { code: "tarde", label: "Tarde" },
  { code: "noite", label: "Noite" },
] as const;

export type PeriodoCode = (typeof PERIODOS)[number]["code"];

export const AREAS = {
  AC: {
    code: "AC",
    label: "Análises Clínicas",
    dias: ["seg", "ter", "qua", "qui", "sab"] as const,
  },
  HEM: {
    code: "HEM",
    label: "Hematologia",
    dias: ["seg", "ter", "qua", "qui"] as const,
  },
  IMG: {
    code: "IMG",
    label: "Imagenologia",
    dias: ["seg", "ter", "qua", "qui"] as const,
  },
  EST: {
    code: "EST",
    label: "Estética",
    dias: ["seg", "ter", "qua", "qui", "sab"] as const,
  },
} as const;

export type AreaCode = keyof typeof AREAS;
export const AREA_CODES = Object.keys(AREAS) as [AreaCode, ...AreaCode[]];

export const UNIDADES = [
  { code: "guarulhos", label: "Guarulhos" },
  { code: "ipiranga", label: "Ipiranga" },
  { code: "liberdade", label: "Liberdade" },
] as const;

export type UnidadeCode = (typeof UNIDADES)[number]["code"];
export const UNIDADE_CODES = UNIDADES.map((u) => u.code) as [
  UnidadeCode,
  ...UnidadeCode[],
];

export const FACULDADES = [
  "Anhanguera Presencial",
  "Anhanguera",
  "Anhembi Presencial",
  "Anhembi Morumbi",
  "Cruzeiro do Sul Presencial",
  "Cruzeiro do Sul Semipresencial",
  "Unicid Presencial",
  "Unicid Semipresencial",
  "UNINTER",
  "Uni Ítalo",
  "Unimais",
  "UNINOVE",
  "Braz Cubas",
  "CTA Ipiranga",
  "Faculdade Sumaré",
  "São Judas",
  "UNG",
  "UniBF",
  "UniBTA",
  "UniFATECIE",
] as const;

/** Nomes antigos ainda aceitos em registros já gravados. */
const FACULDADES_LEGACY = ["UNICID", "Universidade Cruzeiro do Sul"] as const;

export type Faculdade = (typeof FACULDADES)[number];
export type FaculdadeAceita = Faculdade | (typeof FACULDADES_LEGACY)[number];
export const FACULDADE_VALUES: [FaculdadeAceita, ...FaculdadeAceita[]] = [
  FACULDADES[0],
  ...FACULDADES.slice(1),
  ...FACULDADES_LEGACY,
];

/**
 * Vagas por área × turno × unidade (planilha oficial).
 * 0 = slot inexistente / indisponível naquela unidade.
 */
export const VAGAS: Record<
  AreaCode,
  Partial<Record<PeriodoCode, Record<UnidadeCode, number>>>
> = {
  AC: {
    manha: { guarulhos: 60, ipiranga: 60, liberdade: 60 },
    noite: { guarulhos: 60, ipiranga: 60, liberdade: 60 },
    tarde: { guarulhos: 0, ipiranga: 0, liberdade: 60 },
  },
  EST: {
    manha: { guarulhos: 60, ipiranga: 60, liberdade: 60 },
    tarde: { guarulhos: 0, ipiranga: 0, liberdade: 30 },
    noite: { guarulhos: 60, ipiranga: 60, liberdade: 60 },
  },
  HEM: {
    manha: { guarulhos: 0, ipiranga: 0, liberdade: 25 },
    noite: { guarulhos: 0, ipiranga: 0, liberdade: 35 },
  },
  IMG: {
    manha: { guarulhos: 0, ipiranga: 60, liberdade: 60 },
    noite: { guarulhos: 0, ipiranga: 60, liberdade: 60 },
  },
};

export const TIPOS_PERFIL = ["aluno", "nao_aluno"] as const;
export type TipoPerfil = (typeof TIPOS_PERFIL)[number];

export function labelTipoPerfil(
  tipo: TipoPerfil,
  variant: "short" | "long" = "short",
): string {
  switch (tipo) {
    case "aluno":
      return variant === "long" ? "Aluno AMET" : "Aluno";
    case "nao_aluno":
      return variant === "long" ? "Não aluno AMET" : "Não aluno";
    default: {
      const exhaustive: never = tipo;
      return exhaustive;
    }
  }
}

export const ALUNO_STEPS = ["CPF", "Dados", "Unidade", "Área", "Turno", "Confirmar"] as const;
export const NAO_ALUNO_STEPS = [
  "CPF",
  "Dados",
  "Faculdade",
  "Unidade",
  "Área",
  "Turno",
  "Confirmar",
] as const;
export const NAO_ALUNO_STEPS_COM_PAGAMENTO = [
  "CPF",
  "Dados",
  "Faculdade",
  "Pagamento",
  "Unidade",
  "Área",
  "Turno",
  "Confirmar",
] as const;

/** Estas 4 presenciais não pedem forma de pagamento. */
export const FACULDADES_SEM_PAGAMENTO = [
  "Cruzeiro do Sul Presencial",
  "Unicid Presencial",
  "Anhembi Presencial",
  "Anhanguera Presencial",
] as const;

export function requiresFormaPagamento(faculdade: string): boolean {
  return !(FACULDADES_SEM_PAGAMENTO as readonly string[]).includes(faculdade);
}

export const CURSOS = [
  { code: "biomedicina", label: "Biomedicina" },
  { code: "farmacia", label: "Farmácia" },
  { code: "enfermagem", label: "Enfermagem" },
  { code: "nutricao", label: "Nutrição" },
  { code: "fisioterapia", label: "Fisioterapia" },
] as const;

export type CursoCode = (typeof CURSOS)[number]["code"];
export const CURSO_CODES = CURSOS.map((c) => c.code) as [CursoCode, ...CursoCode[]];

export const HORARIOS_FACULDADE = [
  { code: "manha", label: "Manhã" },
  { code: "noite", label: "Noite" },
] as const;

export type HorarioFaculdadeCode = (typeof HORARIOS_FACULDADE)[number]["code"];
export const HORARIO_FACULDADE_CODES = HORARIOS_FACULDADE.map((h) => h.code) as [
  HorarioFaculdadeCode,
  ...HorarioFaculdadeCode[],
];

export const FORMAS_PAGAMENTO = [
  { code: "pix_vista", label: "À vista no Pix" },
  { code: "cartao_10x", label: "Até 10x no cartão de crédito" },
  { code: "boleto", label: "Boleto bancário" },
] as const;

export type FormaPagamentoCode = (typeof FORMAS_PAGAMENTO)[number]["code"];
export const FORMA_PAGAMENTO_CODES = FORMAS_PAGAMENTO.map((f) => f.code) as [
  FormaPagamentoCode,
  ...FormaPagamentoCode[],
];

export const SEMESTRES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] as const;
export type SemestreValue = (typeof SEMESTRES)[number];

export const ESTADOS_BR = [
  { code: "AC", label: "Acre" },
  { code: "AL", label: "Alagoas" },
  { code: "AP", label: "Amapá" },
  { code: "AM", label: "Amazonas" },
  { code: "BA", label: "Bahia" },
  { code: "CE", label: "Ceará" },
  { code: "DF", label: "Distrito Federal" },
  { code: "ES", label: "Espírito Santo" },
  { code: "GO", label: "Goiás" },
  { code: "MA", label: "Maranhão" },
  { code: "MT", label: "Mato Grosso" },
  { code: "MS", label: "Mato Grosso do Sul" },
  { code: "MG", label: "Minas Gerais" },
  { code: "PA", label: "Pará" },
  { code: "PB", label: "Paraíba" },
  { code: "PR", label: "Paraná" },
  { code: "PE", label: "Pernambuco" },
  { code: "PI", label: "Piauí" },
  { code: "RJ", label: "Rio de Janeiro" },
  { code: "RN", label: "Rio Grande do Norte" },
  { code: "RS", label: "Rio Grande do Sul" },
  { code: "RO", label: "Rondônia" },
  { code: "RR", label: "Roraima" },
  { code: "SC", label: "Santa Catarina" },
  { code: "SP", label: "São Paulo" },
  { code: "SE", label: "Sergipe" },
  { code: "TO", label: "Tocantins" },
] as const;

export type EstadoCode = (typeof ESTADOS_BR)[number]["code"];
export const ESTADO_CODES = ESTADOS_BR.map((e) => e.code) as [EstadoCode, ...EstadoCode[]];

export function labelCurso(code: string): string {
  return CURSOS.find((c) => c.code === code)?.label ?? code;
}

export function labelHorarioFaculdade(code: string): string {
  return HORARIOS_FACULDADE.find((h) => h.code === code)?.label ?? code;
}

export function labelFormaPagamento(code: string): string {
  return FORMAS_PAGAMENTO.find((f) => f.code === code)?.label ?? code;
}

export function labelEstado(code: string): string {
  return ESTADOS_BR.find((e) => e.code === code)?.label ?? code;
}

export function labelSemestre(value: string): string {
  return value ? `${value}º semestre` : "";
}

export function vagaLimit(
  area: AreaCode,
  unidade: UnidadeCode,
  periodo: PeriodoCode,
): number {
  return VAGAS[area][periodo]?.[unidade] ?? 0;
}

export function periodosDisponiveis(
  area: AreaCode,
  unidade: UnidadeCode,
): PeriodoCode[] {
  return PERIODOS.map((p) => p.code).filter(
    (periodo) => vagaLimit(area, unidade, periodo) > 0,
  );
}

export function areasDisponiveis(unidade: UnidadeCode): AreaCode[] {
  return AREA_CODES.filter((area) => periodosDisponiveis(area, unidade).length > 0);
}

export function diasDisponiveis(area: AreaCode, periodo: PeriodoCode): DiaCode[] {
  const dias: readonly DiaCode[] = AREAS[area].dias;
  if (periodo !== "manha") {
    return dias.filter((d) => d !== "sab");
  }
  return [...dias];
}

export function totalVagasAreaNaUnidade(
  area: AreaCode,
  unidade: UnidadeCode,
): number {
  return periodosDisponiveis(area, unidade).reduce(
    (sum, periodo) => sum + vagaLimit(area, unidade, periodo),
    0,
  );
}
