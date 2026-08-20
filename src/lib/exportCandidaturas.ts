import ExcelJS from "exceljs";

import { AREAS, DIAS, PERIODOS, UNIDADES, labelTipoPerfil } from "@/lib/constants";
import type { CandidaturaRecord } from "@/lib/db";
import { isNaoAluno } from "@/lib/schemas";

export const EXPORT_HEADERS = [
  "Data/Hora",
  "Perfil",
  "Nome",
  "RGM",
  "CPF",
  "Telefone",
  "E-mail",
  "Faculdade",
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
  const perfil = labelTipoPerfil(item.tipoPerfil);
  const emailStatus = item.emailSent ? "Enviado" : "Falhou";
  const unidade = UNIDADES.find((u) => u.code === item.unidade)?.label ?? item.unidade;
  const area = AREAS[item.area as keyof typeof AREAS]?.label ?? item.area;
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
    isNaoAluno(item) ? item.faculdade : "",
    unidade,
    area,
    periodo,
    dias,
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

  sheet.getColumn(1).width = 20;
  sheet.getColumn(3).width = 32;
  sheet.getColumn(5).width = 16;
  sheet.getColumn(7).width = 32;
  sheet.getColumn(8).width = 28;
  sheet.getColumn(10).width = 18;
  sheet.getColumn(13).width = 22;

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
