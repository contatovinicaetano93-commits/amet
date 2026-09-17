import { describe, expect, it } from "vitest";

import { matchesAdminSearch, normalizeSearchText } from "@/lib/adminSearch";

describe("normalizeSearchText", () => {
  it("strips accents and lowercases", () => {
    expect(normalizeSearchText("  José Silva  ")).toBe("jose silva");
  });
});

describe("matchesAdminSearch", () => {
  const paula = {
    text: ["Paula Braga Nunes", "paulabraganunes@gmail.com"],
    cpf: "50793808880",
  };
  const gabriel = {
    text: ["Gabriel Silva da Mota", "gabriel@example.com"],
    cpf: "12345678909",
  };

  it("returns all when query is empty", () => {
    expect(matchesAdminSearch("", paula)).toBe(true);
    expect(matchesAdminSearch("   ", paula)).toBe(true);
  });

  it("does not match every record when searching by name only", () => {
    // Regression: previously cpf.includes("") made every row match.
    expect(matchesAdminSearch("gabriel silva da mota", paula)).toBe(false);
    expect(matchesAdminSearch("gabriel silva da mota", gabriel)).toBe(true);
  });

  it("matches when tokens appear in any order / accent-insensitive", () => {
    expect(matchesAdminSearch("mota gabriel", gabriel)).toBe(true);
    expect(matchesAdminSearch("GABRIEL", gabriel)).toBe(true);
  });

  it("matches partial CPF digits", () => {
    expect(matchesAdminSearch("507938", paula)).toBe(true);
    expect(matchesAdminSearch("507.938", paula)).toBe(true);
    expect(matchesAdminSearch("999", paula)).toBe(false);
  });

  it("matches email", () => {
    expect(matchesAdminSearch("paulabraganunes", paula)).toBe(true);
  });
});
