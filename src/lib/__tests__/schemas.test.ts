import { describe, expect, it } from "vitest";

import {
  candidaturaAlunoSchema,
  candidaturaNaoAlunoSchema,
  candidaturaSchema,
  diasSelectionError,
  participanteCreateSchema,
  participanteUpdateSchema,
} from "@/lib/schemas";
import { COMPLEMENTO } from "@/lib/__tests__/candidaturaFixture";

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
    ...COMPLEMENTO,
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

  it("rejects a turno not offered for area+unidade (Hematologia has no tarde)", () => {
    const result = candidaturaAlunoSchema.safeParse(
      baseAluno({
        unidade: "liberdade",
        area: "HEM",
        periodo: "tarde",
        dias: ["seg", "ter"],
      }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "periodo")).toBe(true);
    }
  });

  it("rejects Hematologia outside Liberdade", () => {
    const result = candidaturaAlunoSchema.safeParse(
      baseAluno({
        unidade: "ipiranga",
        area: "HEM",
        periodo: "manha",
        dias: ["seg", "ter"],
      }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "area")).toBe(true);
    }
  });

  it("rejects Análises Clínicas tarde outside Liberdade", () => {
    const result = candidaturaAlunoSchema.safeParse(
      baseAluno({
        unidade: "ipiranga",
        area: "AC",
        periodo: "tarde",
        dias: ["seg", "ter"],
      }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "periodo")).toBe(true);
    }
  });

  it("accepts Estética tarde in Liberdade", () => {
    const result = candidaturaAlunoSchema.safeParse(
      baseAluno({
        unidade: "liberdade",
        area: "EST",
        periodo: "tarde",
        dias: ["seg", "ter"],
      }),
    );
    expect(result.success).toBe(true);
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

  it("requires address, birth date, course and semester", () => {
    const result = candidaturaAlunoSchema.safeParse(
      baseAluno({
        rua: "",
        numero: "",
        bairro: "",
        cep: "",
        cidade: "",
        estado: "",
        dataNascimento: "",
        horarioFaculdade: "",
        semestreAtual: "",
        curso: "",
      }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0]);
      expect(paths).toEqual(
        expect.arrayContaining([
          "rua",
          "numero",
          "bairro",
          "cep",
          "cidade",
          "estado",
          "dataNascimento",
          "horarioFaculdade",
          "semestreAtual",
          "curso",
        ]),
      );
    }
  });

  it("allows an empty address complemento", () => {
    const result = candidaturaAlunoSchema.safeParse(baseAluno({ complemento: "" }));
    expect(result.success).toBe(true);
  });
});

describe("candidaturaNaoAlunoSchema", () => {
  function baseNaoAluno(overrides: Record<string, unknown> = {}) {
    return {
      tipoPerfil: "nao_aluno" as const,
      nomeCompleto: "João Teste",
      cpf: VALID_CPF,
      telefone: "11999999999",
      email: "joao@example.com",
      faculdade: "UNINOVE",
      formaPagamento: "pix_vista",
      unidade: "ipiranga",
      area: "EST",
      periodo: "noite",
      dias: ["ter", "qua"],
      ...COMPLEMENTO,
      ...overrides,
    };
  }

  it("accepts a valid não-aluno submission with faculdade and estágio fields", () => {
    const result = candidaturaNaoAlunoSchema.safeParse(baseNaoAluno());
    expect(result.success).toBe(true);
  });

  it("allows an empty RGM for não-alunos", () => {
    const result = candidaturaNaoAlunoSchema.safeParse(baseNaoAluno({ rgm: "" }));
    expect(result.success).toBe(true);
  });

  it("rejects a missing faculdade", () => {
    const result = candidaturaNaoAlunoSchema.safeParse(baseNaoAluno({ faculdade: "" }));
    expect(result.success).toBe(false);
  });

  it("rejects an unknown faculdade", () => {
    const result = candidaturaNaoAlunoSchema.safeParse(
      baseNaoAluno({ faculdade: "Faculdade Inventada" }),
    );
    expect(result.success).toBe(false);
  });

  it("does not require payment for the 4 presencial partner faculties", () => {
    for (const faculdade of [
      "Cruzeiro do Sul Presencial",
      "Unicid Presencial",
      "Anhembi Presencial",
      "Anhanguera Presencial",
    ]) {
      const result = candidaturaNaoAlunoSchema.safeParse(
        baseNaoAluno({ faculdade, formaPagamento: undefined }),
      );
      expect(result.success).toBe(true);
    }
  });

  it("requires payment for other faculties, including semipresencial and legacy names", () => {
    for (const faculdade of [
      "UNINOVE",
      "Unicid Semipresencial",
      "Cruzeiro do Sul Semipresencial",
      "Anhanguera",
      "Anhembi Morumbi",
      "UNICID",
      "Universidade Cruzeiro do Sul",
    ]) {
      const missing = candidaturaNaoAlunoSchema.safeParse(
        baseNaoAluno({ faculdade, formaPagamento: undefined }),
      );
      expect(missing.success).toBe(false);
      if (!missing.success) {
        expect(missing.error.issues.some((issue) => issue.path[0] === "formaPagamento")).toBe(
          true,
        );
      }
      expect(
        candidaturaNaoAlunoSchema.safeParse(
          baseNaoAluno({ faculdade, formaPagamento: "boleto" }),
        ).success,
      ).toBe(true);
    }
  });

  it("accepts Unicid and Cruzeiro do Sul presencial/semipresencial", () => {
    expect(
      candidaturaNaoAlunoSchema.safeParse(
        baseNaoAluno({ faculdade: "Unicid Presencial", formaPagamento: undefined }),
      ).success,
    ).toBe(true);
    expect(
      candidaturaNaoAlunoSchema.safeParse(
        baseNaoAluno({ faculdade: "Cruzeiro do Sul Presencial", formaPagamento: undefined }),
      ).success,
    ).toBe(true);
    expect(
      candidaturaNaoAlunoSchema.safeParse(
        baseNaoAluno({ faculdade: "Unicid Semipresencial", formaPagamento: "cartao_10x" }),
      ).success,
    ).toBe(true);
    expect(
      candidaturaNaoAlunoSchema.safeParse(
        baseNaoAluno({
          faculdade: "Cruzeiro do Sul Semipresencial",
          formaPagamento: "pix_vista",
        }),
      ).success,
    ).toBe(true);
  });

  it("still accepts legacy UNICID and Universidade Cruzeiro do Sul records", () => {
    expect(
      candidaturaNaoAlunoSchema.safeParse(
        baseNaoAluno({ faculdade: "UNICID", formaPagamento: "pix_vista" }),
      ).success,
    ).toBe(true);
    expect(
      candidaturaNaoAlunoSchema.safeParse(
        baseNaoAluno({
          faculdade: "Universidade Cruzeiro do Sul",
          formaPagamento: "boleto",
        }),
      ).success,
    ).toBe(true);
  });

  it("rejects a combo that does not exist (Hematologia em Ipiranga)", () => {
    const result = candidaturaNaoAlunoSchema.safeParse(
      baseNaoAluno({
        unidade: "ipiranga",
        area: "HEM",
        periodo: "manha",
        dias: ["seg", "ter"],
      }),
    );
    expect(result.success).toBe(false);
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
      faculdade: "Anhanguera",
      formaPagamento: "cartao_10x",
      unidade: "liberdade",
      area: "AC",
      periodo: "manha",
      dias: ["seg", "ter"],
      ...COMPLEMENTO,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown tipoPerfil", () => {
    const result = candidaturaSchema.safeParse({ tipoPerfil: "outro" });
    expect(result.success).toBe(false);
  });
});

describe("participante schemas", () => {
  it("accepts a valid aluno record with name and CPF", () => {
    const result = participanteCreateSchema.safeParse({
      cpf: VALID_CPF,
      nome: "Maria Aluna",
      rgm: "123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cpf).toBe("11144477735");
    }
  });

  it("rejects a create without a name", () => {
    const result = participanteCreateSchema.safeParse({
      cpf: VALID_CPF,
      nome: "Al",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid CPF", () => {
    const result = participanteCreateSchema.safeParse({
      cpf: "123",
      nome: "Maria Aluna",
    });
    expect(result.success).toBe(false);
  });

  it("updates name and optional RGM", () => {
    const result = participanteUpdateSchema.safeParse({
      nome: "Maria Atualizada",
      rgm: "",
    });
    expect(result.success).toBe(true);
  });
});
