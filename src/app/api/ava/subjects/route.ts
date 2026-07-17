import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireRole, requireSession } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { subjectCreateSchema } from "@/lib/ava/schemas";
import { subjects } from "@/lib/ava/schema";
import { slugify } from "@/lib/ava/slug";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(subjects)
    .orderBy(asc(subjects.name));

  return NextResponse.json({ subjects: rows });
}

export async function POST(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = subjectCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const baseSlug = slugify(parsed.data.name) || "materia";
  const db = getDb();

  let slug = baseSlug;
  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? baseSlug : `${baseSlug}-${i + 1}`;
    const [existing] = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(eq(subjects.slug, candidate))
      .limit(1);
    if (!existing) {
      slug = candidate;
      break;
    }
  }

  const [subject] = await db
    .insert(subjects)
    .values({ name: parsed.data.name, slug })
    .returning();

  return NextResponse.json({ subject }, { status: 201 });
}
