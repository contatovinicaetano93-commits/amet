import { describe, expect, it } from "vitest";

import {
  buildCandidaturasWorkbook,
  candidaturaToExportRow,
  EXPORT_HEADERS,
} from "@/lib/exportCandidaturas";
import type { CandidaturaRecord } from "@/lib/db";
import { COMPLEMENTO } from "@/lib/__tests__/candidaturaFixture";

function col(name: (typeof EXPORT_HEADERS)[number]) {
  return EXPORT_HEADERS.indexOf(name);
}

describe("exportCandidaturas", () => {
  it("maps aluno fields into separate columns and leaves faculdade empty", () => {
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
      ...COMPLEMENTO,
    } as CandidaturaRecord;

    const row = candidaturaToExportRow(item);
    expect(row).toHaveLength(EXPORT_HEADERS.length);
    expect(row[col("Perfil")]).toBe("Aluno");
    expect(row[col("Nome")]).toBe("Maria Teste");
    expect(row[col("CPF")]).toBe("39053344705");
    expect(row[col("Faculdade")]).toBe("");
    expect(row[col("Forma de pagamento")]).toBe("");
    expect(row[col("Unidade")]).toBeTruthy();
    expect(row[col("Área de estágio")]).toBe("Estética");
    expect(row[col("Curso")]).toBe("Biomedicina");
    expect(row[col("CEP")]).toBe("01310-100");
    expect(row[col("Notificação por e-mail")]).toBe("Enviado");
  });

  it("fills faculdade, payment and stage fields for nao_aluno", () => {
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
      faculdade: "UNINOVE",
      formaPagamento: "pix_vista",
      unidade: "ipiranga",
      area: "IMG",
      periodo: "noite",
      dias: ["qua", "qui"],
      ...COMPLEMENTO,
    } as CandidaturaRecord;

    const row = candidaturaToExportRow(item);
    expect(row[col("Perfil")]).toBe("Não aluno");
    expect(row[col("Faculdade")]).toBe("UNINOVE");
    expect(row[col("Forma de pagamento")]).toBe("À vista no Pix");
    expect(row[col("Unidade")]).toBe("Ipiranga");
    expect(row[col("Área de estágio")]).toBe("Imagenologia");
    expect(row[col("Turno")]).toBe("Noite");
    expect(row[col("Notificação por e-mail")]).toBe("Falhou");
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
      faculdade: "São Judas",
      formaPagamento: "boleto",
      unidade: "guarulhos",
      area: "AC",
      periodo: "manha",
      dias: ["seg", "ter"],
      ...COMPLEMENTO,
    } as CandidaturaRecord;

    const buffer = await buildCandidaturasWorkbook([item]);
    expect(buffer.byteLength).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
  });
});
