import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

import { createCandidatura } from "@/lib/db";

// These tests hit the real Neon database via DATABASE_URL. They create rows
// prefixed with "TESTE " and clean up after themselves in afterAll.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function fakeCpf(prefix: number, n: number): string {
  return String(prefix * 100000000 + n).padStart(11, "0");
}

afterAll(async () => {
  await pool.query(`DELETE FROM candidaturas WHERE nome_completo LIKE 'TESTE %'`);
  await pool.end();
});

describe("createCandidatura concurrency", () => {
  it("never lets concurrent submissions exceed the area/turno vacancy limit", async () => {
    const N = 25; // EST/manha limit is 20
    const results = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        createCandidatura({
          tipoPerfil: "aluno",
          nomeCompleto: `TESTE CONCORRENCIA VAGAS ${i}`,
          rgm: `TESTE-${i}`,
          cpf: fakeCpf(1, i),
          telefone: "11999999999",
          email: `teste-vagas-${i}@example.com`,
          unidade: "ipiranga",
          area: "EST",
          periodo: "manha",
          dias: ["seg"],
        }),
      ),
    );

    const ok = results.filter((r) => r.ok).length;
    const areaFull = results.filter((r) => !r.ok && r.code === "AREA_FULL").length;

    expect(ok).toBe(20);
    expect(areaFull).toBe(5);
  }, 30_000);

  it("never lets the same CPF register twice in the same area under concurrent submission", async () => {
    const N = 10;
    const results = await Promise.all(
      Array.from({ length: N }, () =>
        createCandidatura({
          tipoPerfil: "aluno",
          nomeCompleto: "TESTE CONCORRENCIA DUPLICATA",
          rgm: "TESTE-DUP",
          cpf: fakeCpf(2, 0),
          telefone: "11999999999",
          email: "teste-dup@example.com",
          unidade: "liberdade",
          area: "AC",
          periodo: "tarde",
          dias: ["ter"],
        }),
      ),
    );

    const ok = results.filter((r) => r.ok).length;
    const duplicate = results.filter((r) => !r.ok && r.code === "DUPLICATE").length;

    expect(ok).toBe(1);
    expect(duplicate).toBe(N - 1);
  }, 30_000);
});
