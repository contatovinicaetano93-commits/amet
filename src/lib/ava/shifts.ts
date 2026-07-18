export const shiftCodes = ["manha", "tarde", "noite", "sabado"] as const;

export type ShiftCode = (typeof shiftCodes)[number];

export type ShiftInfo = {
  code: ShiftCode;
  label: string;
  hours: string;
  dayLabel: string;
};

export const SHIFTS: Record<ShiftCode, ShiftInfo> = {
  manha: {
    code: "manha",
    label: "Manhã",
    hours: "09h–13h",
    dayLabel: "Seg–Sex",
  },
  tarde: {
    code: "tarde",
    label: "Tarde",
    hours: "14h–18h",
    dayLabel: "Seg–Sex",
  },
  noite: {
    code: "noite",
    label: "Noite",
    hours: "19h–22h",
    dayLabel: "Seg–Sex",
  },
  sabado: {
    code: "sabado",
    label: "Sábado",
    hours: "09h–13h",
    dayLabel: "Sábado",
  },
};

/** Família de curso que define quais turnos de semana estão disponíveis. */
export type SubjectShiftFamily = "analises" | "padrao";

export function subjectShiftFamily(subjectName: string): SubjectShiftFamily {
  const normalized = subjectName
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

  if (normalized.includes("analis")) {
    return "analises";
  }

  return "padrao";
}

/**
 * Turnos disponíveis por matéria:
 * - Imagem / Hematologia / Estética (e demais): manhã e noite + sábado
 * - Análises: manhã, tarde e noite + sábado
 * - Qualquer curso no sábado: só 09h–13h
 */
export function allowedShiftsForSubject(subjectName: string): ShiftCode[] {
  const family = subjectShiftFamily(subjectName);
  if (family === "analises") {
    return ["manha", "tarde", "noite", "sabado"];
  }
  return ["manha", "noite", "sabado"];
}

export function isShiftAllowedForSubject(
  subjectName: string,
  shift: string,
): shift is ShiftCode {
  return allowedShiftsForSubject(subjectName).includes(shift as ShiftCode);
}

export function shiftLabel(shift: string | null | undefined): string | null {
  if (!shift || !(shift in SHIFTS)) return null;
  const info = SHIFTS[shift as ShiftCode];
  return `${info.label} · ${info.hours}`;
}

export function shiftDetail(shift: string | null | undefined): string | null {
  if (!shift || !(shift in SHIFTS)) return null;
  const info = SHIFTS[shift as ShiftCode];
  if (info.code === "sabado") {
    return `Sábado · ${info.hours}`;
  }
  return `${info.dayLabel} · ${info.label} · ${info.hours}`;
}

export const SHIFT_GUIDE = [
  {
    courses: "Imagem / Hematologia / Estética",
    hours: "09h–13h · 19h–22h",
  },
  {
    courses: "Análises",
    hours: "09h–13h · 14h–18h · 19h–22h",
  },
  {
    courses: "Qualquer curso no sábado",
    hours: "só 09h–13h",
  },
] as const;
