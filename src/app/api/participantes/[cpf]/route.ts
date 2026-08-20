import { NextResponse } from "next/server";

import { checkAdminAccess } from "@/lib/adminAuth";
import { deleteParticipante, updateParticipante } from "@/lib/dbParticipantes";
import { participanteUpdateSchema } from "@/lib/schemas";
import { stripDigits } from "@/lib/validators";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ cpf: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await checkAdminAccess(request, "update_participante");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { cpf } = await context.params;
  const normalized = stripDigits(cpf);
  if (normalized.length !== 11) {
    return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = participanteUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Dados inválidos";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const result = await updateParticipante(normalized, parsed.data);
    if (!result.ok) {
      const status = result.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    return NextResponse.json({ participante: result.participante });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar o aluno." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const admin = await checkAdminAccess(request, "delete_participante");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { cpf } = await context.params;
  const normalized = stripDigits(cpf);
  if (normalized.length !== 11) {
    return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
  }

  const deleted = await deleteParticipante(normalized);
  if (!deleted) {
    return NextResponse.json({ error: "Aluno não encontrado.", code: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
