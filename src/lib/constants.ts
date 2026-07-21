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
    limit: 20,
    periodos: ["manha", "tarde", "noite"] as const,
    dias: ["seg", "ter", "qua", "qui", "sab"] as const,
  },
  HEM: {
    code: "HEM",
    label: "Hematologia",
    limit: 20,
    periodos: ["manha", "noite"] as const,
    dias: ["seg", "ter", "qua", "qui"] as const,
  },
  IMG: {
    code: "IMG",
    label: "Imagenologia",
    limit: 20,
    periodos: ["manha", "noite"] as const,
    dias: ["seg", "ter", "qua", "qui"] as const,
  },
  EST: {
    code: "EST",
    label: "Estética",
    limit: 20,
    periodos: ["manha", "noite"] as const,
    dias: ["seg", "ter", "qua", "qui", "sab"] as const,
  },
} as const;

export type AreaCode = keyof typeof AREAS;
export const AREA_CODES = Object.keys(AREAS) as [AreaCode, ...AreaCode[]];

export const UNIDADES = [
  { code: "ipiranga", label: "Ipiranga", areasExcluidas: [] as AreaCode[] },
  { code: "liberdade", label: "Liberdade", areasExcluidas: [] as AreaCode[] },
  { code: "guarulhos", label: "Guarulhos", areasExcluidas: ["IMG"] as AreaCode[] },
] as const;

export type UnidadeCode = (typeof UNIDADES)[number]["code"];

export const TIPOS_PERFIL = ["aluno", "nao_aluno"] as const;
export type TipoPerfil = (typeof TIPOS_PERFIL)[number];

export const POLLING_INTERVAL_MS = 30_000;

export const ALUNO_STEPS = ["CPF", "Dados", "Unidade", "Área", "Turno", "Confirmar"] as const;
export const NAO_ALUNO_STEPS = ["CPF", "Dados"] as const;

export function areasDisponiveis(unidade: UnidadeCode): AreaCode[] {
  const unit = UNIDADES.find((u) => u.code === unidade);
  const excluded = new Set<AreaCode>(unit?.areasExcluidas ?? []);
  return AREA_CODES.filter((code) => !excluded.has(code));
}

export function diasDisponiveis(area: AreaCode, periodo: PeriodoCode): DiaCode[] {
  const config = AREAS[area];
  const dias: readonly DiaCode[] = config.dias;
  if (periodo !== "manha") {
    return dias.filter((d) => d !== "sab");
  }
  return [...dias];
}
