import { describe, expect, it } from "vitest";

import { isValidCpf, normalizeCpfDigits, stripDigits } from "@/lib/validators";

describe("normalizeCpfDigits", () => {
  it("strips non-digits", () => {
    expect(normalizeCpfDigits("123.456.789-09")).toBe("12345678909");
  });

  it("pads 10-digit values", () => {
    expect(normalizeCpfDigits("0156193205")).toBe("00156193205");
  });

  it("leaves 11-digit values unchanged", () => {
    expect(normalizeCpfDigits("00156193205")).toBe("00156193205");
  });
});

describe("isValidCpf", () => {
  it("accepts a known valid CPF", () => {
    // 529.982.247-25 is a commonly used valid test CPF
    expect(isValidCpf("529.982.247-25")).toBe(true);
  });

  it("rejects repeated digits", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });

  it("rejects wrong length after strip", () => {
    expect(isValidCpf("123")).toBe(false);
    expect(stripDigits("12.3")).toBe("123");
  });
});
