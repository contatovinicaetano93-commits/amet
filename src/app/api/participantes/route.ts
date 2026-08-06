import { NextResponse } from "next/server";
import { z } from "zod";

import { checkAdminAccess } from "@/lib/adminAuth";
import {
  addParticipante,
  deleteParticipantesByCpfs,
  listParticipantes,
  updateParticipante,
} from "@/lib/db";
import { isValidCpf } from "@/lib/validators";

export const dynamic = "force-dynamic";

const cpfField = z
  .string()
  .trim()
  .refine(isValidCpf, "CPF inválido");

const addSchema = z.object({
  cpf: cpfField,
  nome: z.string().trim().max(120).optional().default(""),
});

const updateSchema = z.object({
  cpf: cpfField,
  newCpf: cpfField.optional(),
  nome: z.string().trim().max(120).optional(),
});

const deleteSchema = z.object({
  cpfs: z.array(z.string()).min(1, "Informe ao menos um CPF"),
});

export async function GET(request: Request) {
  const admin = await checkAdminAccess(request, "list_participantes");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Number(searchParams.get("limit") ?? "50");
  const offset = Number(searchParams.get("offset") ?? "0");

  const result = await listParticipantes({
    q,
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
  });

  return NextResponse.json({
    participantes: result.items,
    total: result.total,
  });
}

export async function POST(request: Request) {
  const admin = await checkAdminAccess(request, "add_participante");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const result = await addParticipante(parsed.data.cpf, parsed.data.nome);
  if (!result.ok) {
    const status = result.code === "DUPLICATE" ? 409 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({ ok: true, participante: result.participante }, { status: 201 });
}

export async function PATCH(request: Request) {
  const admin = await checkAdminAccess(request, "update_participante");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  if (parsed.data.newCpf === undefined && parsed.data.nome === undefined) {
    return NextResponse.json(
      { error: "Informe newCpf e/ou nome para atualizar." },
      { status: 400 },
    );
  }

  const result = await updateParticipante(parsed.data.cpf, {
    newCpf: parsed.data.newCpf,
    nome: parsed.data.nome,
  });
  if (!result.ok) {
    const status =
      result.code === "NOT_FOUND" ? 404 : result.code === "DUPLICATE" ? 409 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({ ok: true, participante: result.participante });
}

export async function DELETE(request: Request) {
  const admin = await checkAdminAccess(request, "delete_participantes");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Lista de CPFs inválida" },
      { status: 400 },
    );
  }

  const result = await deleteParticipantesByCpfs(parsed.data.cpfs);
  return NextResponse.json({
    ok: true,
    deleted: result.deleted,
    cpfs: result.cpfs,
  });
}
