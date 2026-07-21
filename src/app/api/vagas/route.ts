import { NextResponse } from "next/server";

import { getVacancyCounts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const areas = await getVacancyCounts();
  return NextResponse.json({ areas, updatedAt: new Date().toISOString() });
}
