import { eq } from "drizzle-orm";

import { getDb } from "@/lib/ava/db";
import { subjects } from "@/lib/ava/schema";
import { slugify } from "@/lib/ava/slug";

/** Matérias canônicas do AVA AMET. */
export const CANONICAL_SUBJECTS = [
  { name: "Estética", slug: "estetica" },
  { name: "Imagem", slug: "imagem" },
  { name: "Hematologia", slug: "hematologia" },
  { name: "Análises Clínicas", slug: "analises-clinicas" },
] as const;

/**
 * Garante as 4 matérias oficiais.
 * Renomeia legados óbvios (ex.: "Estética Facial" → "Estética").
 */
export async function ensureCanonicalSubjects(): Promise<void> {
  const db = getDb();

  const existing = await db.select().from(subjects);
  const bySlug = new Map(existing.map((row) => [row.slug, row]));
  const byName = new Map(
    existing.map((row) => [normalizeSubjectKey(row.name), row]),
  );

  // Migra nome legado mais comum para Estética.
  const legacyEstetica = existing.find((row) => {
    const key = normalizeSubjectKey(row.name);
    return key === "esteticafacial" || key === "estetica-facial";
  });
  if (legacyEstetica) {
    await db
      .update(subjects)
      .set({ name: "Estética", slug: "estetica" })
      .where(eq(subjects.id, legacyEstetica.id));
    bySlug.set("estetica", {
      ...legacyEstetica,
      name: "Estética",
      slug: "estetica",
    });
    byName.set("estetica", {
      ...legacyEstetica,
      name: "Estética",
      slug: "estetica",
    });
  }

  for (const subject of CANONICAL_SUBJECTS) {
    if (bySlug.has(subject.slug)) continue;
    if (byName.has(normalizeSubjectKey(subject.name))) continue;

    const slug = slugify(subject.name) || subject.slug;
    await db.insert(subjects).values({
      name: subject.name,
      slug,
    });
  }
}

function normalizeSubjectKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}
