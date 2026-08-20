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
  "Anhanguera",
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
