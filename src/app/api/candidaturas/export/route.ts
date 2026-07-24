import { NextResponse } from "next/server";

import { checkAdminAccess } from "@/lib/adminAuth";
import { listCandidaturas } from "@/lib/db";
import { buildCandidaturasWorkbook } from "@/lib/exportCandidaturas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await checkAdminAccess(request, "export_candidaturas");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const candidaturas = await listCandidaturas();
  const buffer = await buildCandidaturasWorkbook(candidaturas);
  const filename = `candidaturas-amet-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
