import { NextResponse } from "next/server";
import { z } from "zod";

import { checkAdminAccess } from "@/lib/adminAuth";
import { deleteCandidaturasByCpfs } from "@/lib/db";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  cpfs: z.array(z.string()).min(1, "Informe ao menos um CPF"),
});

export async function POST(request: Request) {
  const admin = await checkAdminAccess(request, "delete_candidaturas");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Lista de CPFs inválida" },
      { status: 400 },
    );
  }

  const result = await deleteCandidaturasByCpfs(parsed.data.cpfs);
  return NextResponse.json({
    ok: true,
    deleted: result.deleted,
    ids: result.ids,
  });
}
