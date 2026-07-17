import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { userCanAccessClass } from "@/lib/ava/access";
import { requireSession } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { canManageClass } from "@/lib/ava/permissions";
import { lessons } from "@/lib/ava/schema";
import { lessonCreateSchema } from "@/lib/ava/schemas";

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = lessonCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const access = await userCanAccessClass({
    userId: session.user.id,
    role: session.user.role,
    classId: parsed.data.classId,
  });

  if (
    !access.classRow ||
    !canManageClass(
      session.user.role,
      access.classRow.teacherId,
      session.user.id,
    )
  ) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const db = getDb();
  const existing = await db
    .select({ order: lessons.order })
    .from(lessons)
    .where(eq(lessons.classId, parsed.data.classId));

  const nextOrder =
    parsed.data.order ??
    (existing.length
      ? Math.max(...existing.map((row) => row.order)) + 1
      : 0);

  const [lesson] = await db
    .insert(lessons)
    .values({
      classId: parsed.data.classId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      order: nextOrder,
      published: 0,
    })
    .returning();

  return NextResponse.json({ lesson }, { status: 201 });
}
