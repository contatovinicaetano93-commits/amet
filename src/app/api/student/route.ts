import { NextResponse } from "next/server";

import { findStudentByCpf } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cpf = searchParams.get("cpf");

  if (!cpf) {
    return NextResponse.json({ error: "CPF não fornecido" }, { status: 400 });
  }

  const student = findStudentByCpf(cpf);

  if (!student) {
    return NextResponse.json({ isStudent: false }, { status: 200 });
  }

  return NextResponse.json(
    {
      isStudent: true,
      student: {
        nome: student.nome,
        email: student.email,
        telefone: student.telefone,
        rgm: student.rgm,
      },
    },
    { status: 200 },
  );
}
