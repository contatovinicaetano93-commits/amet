import { NextResponse } from "next/server";

import { AREAS } from "@/lib/constants";
import { getVacancyCounts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const counts = getVacancyCounts();

  const areas = Object.entries(AREAS).map(([code, area]) => ({
    code,
    label: area.label,
    limit: area.limit,
    used: counts[code as keyof typeof AREAS].used,
    available: counts[code as keyof typeof AREAS].available,
    full: counts[code as keyof typeof AREAS].full,
  }));

  return NextResponse.json({ areas, updatedAt: new Date().toISOString() });
}
