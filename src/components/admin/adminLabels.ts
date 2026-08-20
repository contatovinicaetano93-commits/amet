import { AREAS, DIAS, PERIODOS, UNIDADES } from "@/lib/constants";

export function labelUnidade(code: string) {
  return UNIDADES.find((u) => u.code === code)?.label ?? code;
}

export function labelArea(code: string) {
  return AREAS[code as keyof typeof AREAS]?.label ?? code;
}

export function labelPeriodo(code: string) {
  return PERIODOS.find((p) => p.code === code)?.label ?? code;
}

export function labelDias(codes: string[]) {
  return codes.map((code) => DIAS.find((item) => item.code === code)?.label ?? code).join(", ");
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR");
}
