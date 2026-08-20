import { NextResponse } from "next/server";

import { checkAdminAccess } from "@/lib/adminAuth";
import { createCandidatura } from "@/lib/db";
import { upsertParticipanteFromCandidatura } from "@/lib/dbParticipantes";
import { candidaturaSchema, isAluno } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await checkAdminAccess(request, "create_candidatura");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const parsed = candidaturaSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Dados inválidos";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const result = await createCandidatura(parsed.data);
    if (!result.ok) {
      const status = result.code === "DUPLICATE" ? 409 : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    if (isAluno(parsed.data)) {
      await upsertParticipanteFromCandidatura({
        cpf: parsed.data.cpf,
        nome: parsed.data.nomeCompleto,
        rgm: parsed.data.rgm,
      });
    }

    return NextResponse.json({ candidatura: result.candidatura }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar a candidatura." }, { status: 500 });
  }
}
