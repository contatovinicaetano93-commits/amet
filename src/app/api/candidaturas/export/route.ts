import { NextResponse } from "next/server";

import { checkAdminAccess } from "@/lib/adminAuth";
import { listCandidaturas } from "@/lib/db";
import { buildCandidaturasWorkbook } from "@/lib/exportCandidaturas";
import {
  buildCandidaturasXlsxFilename,
  XLSX_MIME,
} from "@/lib/xlsxDownload";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await checkAdminAccess(request, "export_candidaturas");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const candidaturas = await listCandidaturas();
  const buffer = await buildCandidaturasWorkbook(candidaturas);
  const filename = buildCandidaturasXlsxFilename();
  const body = new Uint8Array(buffer);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${filename}`,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
