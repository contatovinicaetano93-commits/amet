import { NextResponse } from "next/server";

import { createLead } from "@/lib/db";
import { leadSchema } from "@/lib/schemas";
import { sendLeadNotification } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Dados inválidos";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const result = await createLead(parsed.data);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (!result.lead) {
      return NextResponse.json({ error: "Erro ao criar lead" }, { status: 500 });
    }

    await sendLeadNotification(
      parsed.data.nomeCompleto,
      parsed.data.email,
      parsed.data.telefone,
      parsed.data.cpf,
    );

    return NextResponse.json(
      {
        message: "Lead registrado com sucesso!",
        id: result.lead.id,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível registrar o lead." },
      { status: 500 },
    );
  }
}
