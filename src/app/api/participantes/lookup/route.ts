import { NextResponse } from "next/server";

import { isParticipanteCpf } from "@/lib/participantes";
import { cpfLookupSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = cpfLookupSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "CPF inválido";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const found = isParticipanteCpf(parsed.data.cpf);

    return NextResponse.json({
      cpf: parsed.data.cpf,
      found,
      tipoPerfil: found ? "aluno" : "nao_aluno",
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível verificar o CPF." },
      { status: 500 },
    );
  }
}
