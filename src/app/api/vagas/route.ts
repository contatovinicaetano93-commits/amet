import { NextResponse } from "next/server";

import { AREAS, PERIODOS } from "@/lib/constants";
import { getVacancyCounts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const counts = await getVacancyCounts();

  const areas = Object.entries(AREAS).map(([code, area]) => ({
    code,
    label: area.label,
    limit: area.limit,
    periodos: area.periodos,
    used: counts[code as keyof typeof AREAS].used,
    available: counts[code as keyof typeof AREAS].available,
    full: counts[code as keyof typeof AREAS].full,
    unidadesDisponiveis: (area as any).unidadesDisponiveis,
  }));

  return NextResponse.json({ areas, periodos: PERIODOS, updatedAt: new Date().toISOString() });
}
