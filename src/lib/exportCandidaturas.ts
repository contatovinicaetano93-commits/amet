import ExcelJS from "exceljs";

import { AREAS, DIAS, PERIODOS, UNIDADES } from "@/lib/constants";
import type { CandidaturaRecord } from "@/lib/db";
import { isAluno } from "@/lib/schemas";

export const EXPORT_HEADERS = [
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
  "Notificação por e-mail",
] as const;

export function candidaturaToExportRow(item: CandidaturaRecord): string[] {
  const dataHora = new Date(item.createdAt).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
  const perfil = item.tipoPerfil === "aluno" ? "Aluno" : "Não aluno";
  const emailStatus = item.emailSent ? "Enviado" : "Falhou";

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
      emailStatus,
    ];
  }

  return [
    dataHora,
    perfil,
    item.nomeCompleto,
    item.rgm,
    item.cpf,
    item.telefone,
    item.email,
    "",
    "",
    "",
    "",
    emailStatus,
  ];
}

export async function buildCandidaturasWorkbook(
  candidaturas: CandidaturaRecord[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AMET";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Candidaturas", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = EXPORT_HEADERS.map((header) => ({
    header,
    key: header,
    width: Math.max(14, Math.min(36, header.length + 6)),
  }));

  // Widen a few high-value columns for readability
  sheet.getColumn(1).width = 20; // Data/Hora
  sheet.getColumn(3).width = 32; // Nome
  sheet.getColumn(5).width = 16; // CPF
  sheet.getColumn(7).width = 32; // E-mail
  sheet.getColumn(9).width = 18; // Área
  sheet.getColumn(12).width = 22; // Notificação

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A5F" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "left" };

  for (const item of candidaturas) {
    sheet.addRow(candidaturaToExportRow(item));
  }

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, candidaturas.length + 1), column: EXPORT_HEADERS.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
