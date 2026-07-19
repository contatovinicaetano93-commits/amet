import { NextResponse } from "next/server";

import { createCandidatura, listCandidaturas } from "@/lib/db";
import { sendCandidaturaEmail } from "@/lib/email";
import { isParticipanteCpf } from "@/lib/participantes";
import { candidaturaSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

function isAdmin(request: Request): boolean {
  const key = process.env.ADMIN_KEY ?? "amet-admin";
  return request.headers.get("x-admin-key") === key;
}

export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return NextResponse.json({ candidaturas: listCandidaturas() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = candidaturaSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Dados inválidos";
      return NextResponse.json({ error: firstError }, { status: 400 });
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

    const result = createCandidatura(parsed.data);

    if (!result.ok) {
      const status = result.code === "AREA_FULL" ? 409 : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    const emailResult = await sendCandidaturaEmail(parsed.data);
    if (!emailResult.ok) {
      console.error("[candidaturas] Email:", emailResult.error);
      // Inscrição já gravada — não falha o envio por causa do e-mail
    }

    return NextResponse.json(
      { message: "Candidatura registrada com sucesso!", id: result.candidatura.id },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Não foi possível processar sua candidatura." }, { status: 500 });
  }
}
