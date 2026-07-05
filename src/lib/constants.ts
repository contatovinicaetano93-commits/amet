export const AREAS = {
  IMG: { code: "IMG", label: "Imagenologia", limit: 20 },
  AC: { code: "AC", label: "Análises Clínicas", limit: 50 },
  EST: { code: "EST", label: "Estética", limit: 20 },
} as const;

export type AreaCode = keyof typeof AREAS;

export const CURSOS = [
  "Imagenologia",
  "Estética",
  "Análises Clínicas",
  "Hematologia",
] as const;

export type CursoAtual = (typeof CURSOS)[number];

export const UNIDADES = [
  { code: "liberdade", label: "Liberdade" },
  { code: "cta", label: "CTA" },
  { code: "guarulhos", label: "Guarulhos" },
] as const;

export type UnidadeCode = (typeof UNIDADES)[number]["code"];

export const TIPOS_PERFIL = ["aluno", "nao_aluno"] as const;
export type TipoPerfil = (typeof TIPOS_PERFIL)[number];

export const POLLING_INTERVAL_MS = 30_000;

export const FORM_STEPS = [
  "Perfil",
  "Dados",
  "Unidades",
  "Cursos",
  "Vagas",
] as const;
