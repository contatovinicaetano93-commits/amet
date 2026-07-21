import { NextResponse } from "next/server";

import { listCandidaturas } from "@/lib/db";
import { AREAS, DIAS, PERIODOS, UNIDADES } from "@/lib/constants";
import { isAluno } from "@/lib/schemas";

export const dynamic = "force-dynamic";

function isAdmin(request: Request): boolean {
  const key = process.env.ADMIN_KEY ?? "amet-admin";
  return request.headers.get("x-admin-key") === key;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const HEADERS = [
  "Data/Hora",
  "Perfil",
  "Nome",
  "RGM",
  "CPF",
  "Telefone",
  "E-mail",
  "Unidade",
  "Área de estágio",
  "Turno",
  "Dias",
];

export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const candidaturas = await listCandidaturas();

  const rows = candidaturas.map((item) => {
    const dataHora = new Date(item.createdAt).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
    const perfil = item.tipoPerfil === "aluno" ? "Aluno" : "Não aluno";

    if (isAluno(item)) {
      const unidade = UNIDADES.find((u) => u.code === item.unidade)?.label ?? item.unidade;
      const area = AREAS[item.area]?.label ?? item.area;
      const periodo = PERIODOS.find((p) => p.code === item.periodo)?.label ?? item.periodo;
      const dias = item.dias
        .map((code) => DIAS.find((d) => d.code === code)?.label ?? code)
        .join(" / ");

      return [
        dataHora,
        perfil,
        item.nomeCompleto,
        item.rgm,
        item.cpf,
        item.telefone,
        item.email,
        unidade,
        area,
        periodo,
        dias,
      ];
    }

    return [dataHora, perfil, item.nomeCompleto, item.rgm, item.cpf, item.telefone, item.email, "", "", "", ""];
  });

  const csvLines = [HEADERS, ...rows].map((row) => row.map((cell) => csvEscape(String(cell))).join(","));
  const csv = "﻿" + csvLines.join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="candidaturas-amet-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
