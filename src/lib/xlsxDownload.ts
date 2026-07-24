export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function isXlsxBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 2) return false;
  const bytes = new Uint8Array(buffer);
  // XLSX is a ZIP archive ("PK")
  return bytes[0] === 0x50 && bytes[1] === 0x4b;
}

export function buildCandidaturasXlsxFilename(date = new Date()): string {
  return `candidaturas-amet-${date.toISOString().slice(0, 10)}.xlsx`;
}

/** Always force a .xlsx name — never trust Content-Disposition (browsers may keep .csv). */
export function forceXlsxFilename(name: string, date = new Date()): string {
  const base = name
    .trim()
    .replace(/["']/g, "")
    .replace(/\.(csv|xlsx|xls)$/i, "");
  if (!base || base.includes(";") || base.includes("/") || base.includes("\\")) {
    return buildCandidaturasXlsxFilename(date);
  }
  return `${base}.xlsx`;
}
