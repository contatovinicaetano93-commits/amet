import { stripDigits } from "@/lib/validators";

/** Lowercase + strip accents for tolerant name search. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Admin list filter: every word must appear in the text fields,
 * or the digit sequence must appear in the CPF.
 *
 * Important: never call `cpf.includes("")` — empty string matches every CPF.
 */
export function matchesAdminSearch(
  query: string,
  fields: { text?: Array<string | null | undefined>; cpf?: string | null | undefined },
): boolean {
  const raw = query.trim();
  if (!raw) return true;

  const digits = stripDigits(raw);
  if (digits.length > 0 && (fields.cpf ?? "").includes(digits)) {
    return true;
  }

  const tokens = normalizeSearchText(raw).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const haystack = normalizeSearchText(
    (fields.text ?? []).filter(Boolean).join(" "),
  );
  return tokens.every((token) => haystack.includes(token));
}
