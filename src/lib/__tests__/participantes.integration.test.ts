import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

import { createCandidatura, deleteCandidaturaById, updateCandidatura } from "@/lib/db";
import {
  createParticipante,
  deleteParticipante,
  isParticipanteCpf,
  updateParticipante,
} from "@/lib/dbParticipantes";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function fakeCpf(prefix: number, n: number): string {
  return String(prefix * 100000000 + n).padStart(11, "0");
}

afterAll(async () => {
  await pool.query(`DELETE FROM participantes WHERE nome LIKE 'TESTE %'`);
  await pool.query(`DELETE FROM candidaturas WHERE nome_completo LIKE 'TESTE %'`);
  await pool.end();
});

describe("participantes CRUD", () => {
  it("creates, looks up, updates and deletes an aluno", async () => {
    const cpf = fakeCpf(8, 1);
    const created = await createParticipante({
      cpf,
      nome: "TESTE ALUNO PAINEL",
      rgm: "RGM-1",
    });
    expect(created.ok).toBe(true);
    expect(await isParticipanteCpf(cpf)).toBe(true);

    const duplicate = await createParticipante({
      cpf,
      nome: "TESTE ALUNO DUPLICADO",
      rgm: "",
    });
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.code).toBe("DUPLICATE");

    const updated = await updateParticipante(cpf, {
      nome: "TESTE ALUNO EDITADO",
      rgm: "RGM-2",
    });
    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.participante.nome).toBe("TESTE ALUNO EDITADO");
      expect(updated.participante.rgm).toBe("RGM-2");
    }

    expect(await deleteParticipante(cpf)).toBe(true);
    expect(await isParticipanteCpf(cpf)).toBe(false);
  }, 30_000);
});

describe("admin candidatura update/delete", () => {
  it("updates fields and then deletes the row", async () => {
    const cpf = fakeCpf(8, 2);
    const created = await createCandidatura({
      tipoPerfil: "nao_aluno",
      nomeCompleto: "TESTE CANDIDATURA EDIT",
      rgm: "",
      cpf,
      telefone: "11999999999",
      email: "teste-edit@example.com",
      faculdade: "UNICID",
      unidade: "guarulhos",
      area: "AC",
      periodo: "manha",
      dias: ["seg", "ter"],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await updateCandidatura(created.candidatura.id, {
      tipoPerfil: "nao_aluno",
      nomeCompleto: "TESTE CANDIDATURA EDITADA",
      rgm: "",
      cpf,
      telefone: "11988887777",
      email: "teste-editada@example.com",
      faculdade: "UNINOVE",
      unidade: "liberdade",
      area: "EST",
      periodo: "noite",
      dias: ["qua", "qui"],
    });
    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.candidatura.nomeCompleto).toBe("TESTE CANDIDATURA EDITADA");
      expect(updated.candidatura.unidade).toBe("liberdade");
    }

    expect(await deleteCandidaturaById(created.candidatura.id)).toBe(true);
  }, 30_000);
});
