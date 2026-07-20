import { NextResponse } from "next/server";

import { createCandidatura } from "@/lib/db";
import { candidaturaSchema } from "@/lib/schemas";
import { sendCandidacyConfirmation, sendAdminNotification } from "@/lib/email";
import { AREAS } from "@/lib/constants";

export const dynamic = "force-dynamic";

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
      const status = result.code === "AREA_FULL" ? 409 : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    const areaLabel = AREAS[parsed.data.areaInteresse as keyof typeof AREAS]?.label || parsed.data.areaInteresse;

    await Promise.all([
      sendCandidacyConfirmation(
        parsed.data.nomeCompleto,
        parsed.data.email,
        areaLabel,
        parsed.data.cursoAtual,
      ),
      sendAdminNotification(
        parsed.data.nomeCompleto,
        parsed.data.email,
        parsed.data.telefone,
        parsed.data.cpf,
        parsed.data.rgm,
        areaLabel,
        parsed.data.cursoAtual,
      ),
    ]);

    return NextResponse.json(
      {
        message: "Candidatura enviada com sucesso!",
        id: result.candidatura.id,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível processar sua candidatura." },
      { status: 500 },
    );
  }
}
