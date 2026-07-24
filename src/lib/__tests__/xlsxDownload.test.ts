import { describe, expect, it } from "vitest";

import {
  buildCandidaturasXlsxFilename,
  forceXlsxFilename,
  isXlsxBuffer,
} from "@/lib/xlsxDownload";

describe("xlsxDownload", () => {
  it("detects xlsx zip magic bytes", () => {
    expect(isXlsxBuffer(new Uint8Array([0x50, 0x4b, 0x03, 0x04]).buffer)).toBe(
      true,
    );
    expect(isXlsxBuffer(new Uint8Array([0x22, 0x69, 0x64]).buffer)).toBe(false);
  });

  it("forces .xlsx even when the server suggests .csv", () => {
    expect(forceXlsxFilename('candidaturas-amet-2026-07-24.csv')).toBe(
      "candidaturas-amet-2026-07-24.xlsx",
    );
    expect(forceXlsxFilename("candidaturas-amet-2026-07-24.xlsx")).toBe(
      "candidaturas-amet-2026-07-24.xlsx",
    );
  });

  it("falls back when disposition junk is present", () => {
    const fallback = buildCandidaturasXlsxFilename(
      new Date("2026-07-24T12:00:00.000Z"),
    );
    expect(
      forceXlsxFilename(
        "candidaturas-amet-2026-07-24.xlsx; filename*=UTF-8''x.csv",
        new Date("2026-07-24T12:00:00.000Z"),
      ),
    ).toBe(fallback);
  });
});
