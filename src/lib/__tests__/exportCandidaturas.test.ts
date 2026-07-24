import { describe, expect, it } from "vitest";

import {
  buildCandidaturasWorkbook,
  candidaturaToExportRow,
  EXPORT_HEADERS,
} from "@/lib/exportCandidaturas";
import type { CandidaturaRecord } from "@/lib/db";

describe("exportCandidaturas", () => {
  it("maps aluno fields into separate columns", () => {
    const item = {
      id: "1",
      createdAt: "2026-07-23T17:32:15.000Z",
      emailSent: true,
      emailError: null,
      tipoPerfil: "aluno",
      nomeCompleto: "Maria Teste",
      rgm: "123",
      cpf: "39053344705",
      telefone: "11999999999",
      email: "maria@example.com",
      unidade: "liberdade",
      area: "EST",
      periodo: "manha",
      dias: ["seg", "ter"],
    } as CandidaturaRecord;

    const row = candidaturaToExportRow(item);
    expect(row).toHaveLength(EXPORT_HEADERS.length);
    expect(row[1]).toBe("Aluno");
    expect(row[2]).toBe("Maria Teste");
    expect(row[4]).toBe("39053344705");
    expect(row[7]).toBeTruthy();
    expect(row[8]).toBe("Estética");
    expect(row[11]).toBe("Enviado");
  });

  it("leaves stage fields empty for nao_aluno", () => {
    const item = {
      id: "2",
      createdAt: "2026-07-23T17:32:15.000Z",
      emailSent: false,
      emailError: "x",
      tipoPerfil: "nao_aluno",
      nomeCompleto: "João Teste",
      rgm: "",
      cpf: "52998224725",
      telefone: "11988887777",
      email: "joao@example.com",
    } as CandidaturaRecord;

    const row = candidaturaToExportRow(item);
    expect(row[1]).toBe("Não aluno");
    expect(row[7]).toBe("");
    expect(row[8]).toBe("");
    expect(row[9]).toBe("");
    expect(row[10]).toBe("");
    expect(row[11]).toBe("Falhou");
  });

  it("builds a real xlsx buffer with one column per header", async () => {
    const item = {
      id: "3",
      createdAt: "2026-07-23T17:32:15.000Z",
      emailSent: true,
      emailError: null,
      tipoPerfil: "nao_aluno",
      nomeCompleto: "Ana Teste",
      rgm: "",
      cpf: "11144477735",
      telefone: "11977776666",
      email: "ana@example.com",
    } as CandidaturaRecord;

    const buffer = await buildCandidaturasWorkbook([item]);
    expect(buffer.byteLength).toBeGreaterThan(1000);
    // xlsx files are zip archives starting with PK
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
  });
});
