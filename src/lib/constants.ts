export const UNIDADES = {
  IPIRANGA: { code: "IPIRANGA", label: "Ipiranga" },
  LIBERDADE: { code: "LIBERDADE", label: "Liberdade" },
  GUARULHOS: { code: "GUARULHOS", label: "Guarulhos" },
} as const;

export type UnidadeCode = keyof typeof UNIDADES;

export const AREAS = {
  AC: {
    code: "AC",
    label: "Análises Clínicas",
    limit: 20,
    periodos: ["MANHÃ", "TARDE", "NOITE"],
    dias: "seg-quinta; sábado só manhã",
  },
  HEM: {
    code: "HEM",
    label: "Hematologia",
    limit: 20,
    periodos: ["MANHÃ", "NOITE"],
    dias: "seg-quinta",
  },
  IMG: {
    code: "IMG",
    label: "Imagenologia",
    limit: 20,
    periodos: ["MANHÃ", "NOITE"],
    dias: "seg-quinta",
    unidadesDisponiveis: ["IPIRANGA", "LIBERDADE"],
  },
  EST: {
    code: "EST",
    label: "Estética",
    limit: 20,
    periodos: ["MANHÃ", "NOITE"],
    dias: "seg-quinta; sábado só manhã",
  },
} as const;

export type AreaCode = keyof typeof AREAS;

export const PERIODOS = ["MANHÃ", "TARDE", "NOITE"] as const;

export type Periodo = (typeof PERIODOS)[number];

export const POLLING_INTERVAL_MS = 30_000;
