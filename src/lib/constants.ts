export const AREAS = {
  AC: { code: "AC", label: "AC", limit: 50 },
  BCT: { code: "BCT", label: "BCT", limit: 20 },
  BC: { code: "BC", label: "BC", limit: 20 },
  NMA: { code: "NMA", label: "NMA", limit: 20 },
} as const;

export type AreaCode = keyof typeof AREAS;

export const CURSOS = [
  "Imaginologia",
  "Estética",
  "Análises Clínicas",
  "Hematologia",
] as const;

export type CursoAtual = (typeof CURSOS)[number];

export const POLLING_INTERVAL_MS = 30_000;
