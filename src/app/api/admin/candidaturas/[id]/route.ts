import { NextResponse } from "next/server";

import { checkAdminAccess } from "@/lib/adminAuth";
import { deleteCandidaturaById, updateCandidatura } from "@/lib/db";
import { upsertParticipanteFromCandidatura } from "@/lib/dbParticipantes";
import { candidaturaSchema, isAluno } from "@/lib/schemas";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await checkAdminAccess(request, "update_candidatura");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Candidatura inválida." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = candidaturaSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Dados inválidos";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const result = await updateCandidatura(id, parsed.data);
    if (!result.ok) {
      const status =
        result.code === "NOT_FOUND" ? 404 : result.code === "DUPLICATE" ? 409 : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    if (isAluno(parsed.data)) {
      await upsertParticipanteFromCandidatura({
        cpf: parsed.data.cpf,
        nome: parsed.data.nomeCompleto,
        rgm: parsed.data.rgm,
      });
    }

    return NextResponse.json({ candidatura: result.candidatura });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar a candidatura." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const admin = await checkAdminAccess(request, "delete_candidatura");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Candidatura inválida." }, { status: 400 });
  }

  const deleted = await deleteCandidaturaById(id);
  if (!deleted) {
    return NextResponse.json(
      { error: "Candidatura não encontrada.", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
