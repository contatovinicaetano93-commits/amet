import { describe, expect, it } from "vitest";

import {
  areasDisponiveis,
  diasDisponiveis,
  periodosDisponiveis,
  totalVagasAreaNaUnidade,
  vagaLimit,
} from "@/lib/constants";

describe("vagaLimit / disponibilidade por unidade", () => {
  it("matches the official vacancy spreadsheet totals", () => {
    expect(vagaLimit("AC", "guarulhos", "manha")).toBe(60);
    expect(vagaLimit("AC", "ipiranga", "tarde")).toBe(0);
    expect(vagaLimit("AC", "liberdade", "tarde")).toBe(60);
    expect(vagaLimit("EST", "liberdade", "tarde")).toBe(30);
    expect(vagaLimit("HEM", "liberdade", "manha")).toBe(25);
    expect(vagaLimit("HEM", "ipiranga", "manha")).toBe(0);
    expect(vagaLimit("IMG", "guarulhos", "noite")).toBe(0);
    expect(vagaLimit("IMG", "ipiranga", "noite")).toBe(60);
  });

  it("exposes only areas with at least one open slot in the unit", () => {
    expect(areasDisponiveis("guarulhos")).toEqual(["AC", "EST"]);
    expect(areasDisponiveis("ipiranga")).toEqual(["AC", "IMG", "EST"]);
    expect(areasDisponiveis("liberdade")).toEqual(["AC", "HEM", "IMG", "EST"]);
  });

  it("exposes only turnos with vacancies for area+unidade", () => {
    expect(periodosDisponiveis("AC", "guarulhos")).toEqual(["manha", "noite"]);
    expect(periodosDisponiveis("AC", "liberdade")).toEqual([
      "manha",
      "tarde",
      "noite",
    ]);
    expect(periodosDisponiveis("EST", "liberdade")).toEqual([
      "manha",
      "tarde",
      "noite",
    ]);
    expect(periodosDisponiveis("HEM", "liberdade")).toEqual(["manha", "noite"]);
    expect(periodosDisponiveis("IMG", "ipiranga")).toEqual(["manha", "noite"]);
  });

  it("sums area vacancies inside a unit", () => {
    expect(totalVagasAreaNaUnidade("AC", "liberdade")).toBe(180);
    expect(totalVagasAreaNaUnidade("EST", "liberdade")).toBe(150);
    expect(totalVagasAreaNaUnidade("HEM", "liberdade")).toBe(50);
    expect(totalVagasAreaNaUnidade("IMG", "guarulhos")).toBe(0);
  });
});

describe("diasDisponiveis", () => {
  it("includes Sábado for areas that offer it, only in the morning turno", () => {
    expect(diasDisponiveis("AC", "manha")).toContain("sab");
    expect(diasDisponiveis("AC", "tarde")).not.toContain("sab");
    expect(diasDisponiveis("EST", "manha")).toContain("sab");
    expect(diasDisponiveis("EST", "noite")).not.toContain("sab");
  });

  it("never includes Sábado for areas that don't offer it, even in the morning", () => {
    expect(diasDisponiveis("HEM", "manha")).not.toContain("sab");
    expect(diasDisponiveis("IMG", "manha")).not.toContain("sab");
  });

  it("returns weekday-only lists for HEM and IMG", () => {
    expect(diasDisponiveis("HEM", "manha")).toEqual(["seg", "ter", "qua", "qui"]);
    expect(diasDisponiveis("IMG", "noite")).toEqual(["seg", "ter", "qua", "qui"]);
  });
});
