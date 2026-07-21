import { describe, expect, it } from "vitest";

import { areasDisponiveis, diasDisponiveis } from "@/lib/constants";

describe("areasDisponiveis", () => {
  it("excludes Imagenologia in Guarulhos", () => {
    expect(areasDisponiveis("guarulhos")).not.toContain("IMG");
  });

  it("includes all areas in Ipiranga and Liberdade", () => {
    expect(areasDisponiveis("ipiranga")).toEqual(["AC", "HEM", "IMG", "EST"]);
    expect(areasDisponiveis("liberdade")).toEqual(["AC", "HEM", "IMG", "EST"]);
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
