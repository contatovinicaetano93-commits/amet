import { describe, expect, it } from "vitest";

import {
  candidaturaAlunoSchema,
  candidaturaNaoAlunoSchema,
  candidaturaSchema,
  diasSelectionError,
} from "@/lib/schemas";

const VALID_CPF = "111.444.777-35"; // known-valid check-digit test CPF

function baseAluno(overrides: Record<string, unknown> = {}) {
  return {
    tipoPerfil: "aluno" as const,
    nomeCompleto: "Maria Teste",
    rgm: "12345",
    cpf: VALID_CPF,
    telefone: "11999999999",
    email: "maria@example.com",
    unidade: "ipiranga",
    area: "AC",
    periodo: "manha",
    dias: ["seg", "ter"],
    ...overrides,
  };
}

describe("candidaturaAlunoSchema", () => {
  it("accepts a valid aluno submission", () => {
    const result = candidaturaAlunoSchema.safeParse(baseAluno());
    expect(result.success).toBe(true);
  });

  it("rejects an invalid CPF", () => {
    const result = candidaturaAlunoSchema.safeParse(baseAluno({ cpf: "123" }));
    expect(result.success).toBe(false);
  });

  it("rejects an area not offered at the chosen unidade (Imagenologia at Guarulhos)", () => {
    const result = candidaturaAlunoSchema.safeParse(
      baseAluno({
        unidade: "guarulhos",
        area: "IMG",
        periodo: "manha",
        dias: ["seg", "ter"],
      }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "area")).toBe(true);
    }
  });

  it("rejects a turno not offered by the area (Hematologia has no tarde)", () => {
    const result = candidaturaAlunoSchema.safeParse(
      baseAluno({ area: "HEM", periodo: "tarde", dias: ["seg", "ter"] }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "periodo")).toBe(true);
    }
  });

  it("rejects Sábado for a non-manhã turno", () => {
    const result = candidaturaAlunoSchema.safeParse(
      baseAluno({ area: "AC", periodo: "noite", dias: ["sab"] }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects Sábado combined with another day", () => {
    const result = candidaturaAlunoSchema.safeParse(
      baseAluno({ area: "AC", periodo: "manha", dias: ["sab", "seg"] }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts Sábado alone", () => {
    const result = candidaturaAlunoSchema.safeParse(
      baseAluno({ area: "AC", periodo: "manha", dias: ["sab"] }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a single weekday (only Sábado may be alone)", () => {
    const result = candidaturaAlunoSchema.safeParse(baseAluno({ dias: ["seg"] }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "dias")).toBe(true);
    }
  });

  it("rejects more than 2 dias", () => {
    const result = candidaturaAlunoSchema.safeParse(
      baseAluno({ dias: ["seg", "ter", "qua"] }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts exactly 2 dias", () => {
    const result = candidaturaAlunoSchema.safeParse(baseAluno({ dias: ["seg", "ter"] }));
    expect(result.success).toBe(true);
  });

  it("diasSelectionError encodes the 2-day / Saturday-only rule", () => {
    expect(diasSelectionError([])).toBeTruthy();
    expect(diasSelectionError(["seg"])).toMatch(/2 dias/i);
    expect(diasSelectionError(["sab"])).toBeNull();
    expect(diasSelectionError(["seg", "ter"])).toBeNull();
    expect(diasSelectionError(["seg", "ter", "qua"])).toMatch(/máximo 2/i);
    expect(diasSelectionError(["sab", "seg"])).toMatch(/Sábado/i);
  });

  it("requires a non-empty RGM for alunos", () => {
    const result = candidaturaAlunoSchema.safeParse(baseAluno({ rgm: "" }));
    expect(result.success).toBe(false);
  });
});

describe("candidaturaNaoAlunoSchema", () => {
  it("accepts a valid não-aluno submission without unidade/area/turno", () => {
    const result = candidaturaNaoAlunoSchema.safeParse({
      tipoPerfil: "nao_aluno",
      nomeCompleto: "João Teste",
      cpf: VALID_CPF,
      telefone: "11999999999",
      email: "joao@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("allows an empty RGM for não-alunos", () => {
    const result = candidaturaNaoAlunoSchema.safeParse({
      tipoPerfil: "nao_aluno",
      nomeCompleto: "João Teste",
      rgm: "",
      cpf: VALID_CPF,
      telefone: "11999999999",
      email: "joao@example.com",
    });
    expect(result.success).toBe(true);
  });
});

describe("candidaturaSchema (discriminated union)", () => {
  it("routes aluno payloads through the aluno schema", () => {
    const result = candidaturaSchema.safeParse(baseAluno());
    expect(result.success).toBe(true);
  });

  it("routes não_aluno payloads through the não_aluno schema", () => {
    const result = candidaturaSchema.safeParse({
      tipoPerfil: "nao_aluno",
      nomeCompleto: "João Teste",
      cpf: VALID_CPF,
      telefone: "11999999999",
      email: "joao@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown tipoPerfil", () => {
    const result = candidaturaSchema.safeParse({ tipoPerfil: "outro" });
    expect(result.success).toBe(false);
  });
});
