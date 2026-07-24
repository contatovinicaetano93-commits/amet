import { NextResponse } from "next/server";

import { checkAdminAccess } from "@/lib/adminAuth";
import {
  candidaturaExistsByCpf,
  createCandidatura,
  listCandidaturas,
  updateEmailStatus,
} from "@/lib/db";
import { sendCandidaturaEmailWithRetry } from "@/lib/email";
import { isParticipanteCpf } from "@/lib/participantes";
import { candidaturaSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

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

    if (await candidaturaExistsByCpf(parsed.data.cpf)) {
      return NextResponse.json(
        {
          error: "Já existe um cadastro com este CPF. Só é permitido um cadastro por CPF.",
          code: "DUPLICATE",
        },
        { status: 409 },
      );
    }

    if (parsed.data.tipoPerfil === "aluno" && !isParticipanteCpf(parsed.data.cpf)) {
      return NextResponse.json(
        {
          error:
            "CPF não encontrado na base de alunos AMET. Selecione “Não sou aluno AMET” ou verifique o CPF.",
          code: "CPF_NOT_IN_BASE",
        },
        { status: 400 },
      );
    }

    const result = await createCandidatura(parsed.data);

    if (!result.ok) {
      const status =
        result.code === "AREA_FULL" || result.code === "DUPLICATE" ? 409 : 400;
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
