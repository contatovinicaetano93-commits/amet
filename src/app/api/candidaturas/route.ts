import { NextResponse } from "next/server";
import { z } from "zod";

import { checkAdminAccess } from "@/lib/adminAuth";
import {
  createCandidatura,
  listCandidaturas,
  updateCandidatura,
  updateEmailStatus,
} from "@/lib/db";
import { sendCandidaturaEmailWithRetry } from "@/lib/email";
import { candidaturaSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

const updateBodySchema = z
  .object({
    id: z.string().uuid("ID inválido"),
  })
  .and(candidaturaSchema);

export async function GET(request: Request) {
  const admin = await checkAdminAccess(request, "list_candidaturas");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  return NextResponse.json({ candidaturas: await listCandidaturas() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = candidaturaSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Dados inválidos";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const result = await createCandidatura(parsed.data);

    if (!result.ok) {
      const status =
        result.code === "AREA_FULL" ||
        result.code === "DUPLICATE" ||
        result.code === "CPF_NOT_IN_BASE"
          ? result.code === "CPF_NOT_IN_BASE"
            ? 400
            : 409
          : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    const emailResult = await sendCandidaturaEmailWithRetry(parsed.data);
    if (!emailResult.ok) {
      console.error("[candidaturas] Email:", emailResult.error);
    }
    // Inscrição já gravada — não falha a resposta por causa do e-mail, mas o
    // status fica visível no painel admin para follow-up manual se necessário.
    await updateEmailStatus(result.candidatura.id, emailResult.ok, emailResult.ok ? null : emailResult.error);

    return NextResponse.json(
      { message: "Candidatura registrada com sucesso!", id: result.candidatura.id },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Não foi possível processar sua candidatura." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await checkAdminAccess(request, "update_candidatura");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = updateBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const { id, ...input } = parsed.data;
  const result = await updateCandidatura(id, input);
  if (!result.ok) {
    const status =
      result.code === "NOT_FOUND"
        ? 404
        : result.code === "DUPLICATE" || result.code === "AREA_FULL"
          ? 409
          : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({ ok: true, candidatura: result.candidatura });
}
