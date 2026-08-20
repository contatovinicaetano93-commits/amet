import { NextResponse } from "next/server";

import { checkAdminAccess } from "@/lib/adminAuth";
import { createParticipante, listParticipantes } from "@/lib/dbParticipantes";
import { participanteCreateSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await checkAdminAccess(request, "list_participantes");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  return NextResponse.json({ participantes: await listParticipantes() });
}

export async function POST(request: Request) {
  const admin = await checkAdminAccess(request, "create_participante");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const parsed = participanteCreateSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Dados inválidos";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const result = await createParticipante(parsed.data);
    if (!result.ok) {
      const status = result.code === "DUPLICATE" ? 409 : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    return NextResponse.json({ participante: result.participante }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar o aluno." }, { status: 500 });
  }
}
