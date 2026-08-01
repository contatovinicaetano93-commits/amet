import { NextResponse } from "next/server";

import { UNIDADE_CODES, type UnidadeCode } from "@/lib/constants";
import { getVacancyCounts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const unidade = searchParams.get("unidade");

  if (!unidade || !(UNIDADE_CODES as readonly string[]).includes(unidade)) {
    return NextResponse.json(
      { error: "Informe uma unidade válida (guarulhos, ipiranga ou liberdade)." },
      { status: 400 },
    );
  }

  const areas = await getVacancyCounts(unidade as UnidadeCode);
  return NextResponse.json({
    unidade,
    areas,
    updatedAt: new Date().toISOString(),
  });
}
