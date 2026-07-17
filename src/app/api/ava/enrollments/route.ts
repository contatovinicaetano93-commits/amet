import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { classes, enrollments, users } from "@/lib/ava/schema";
import { enrollmentCreateSchema } from "@/lib/ava/schemas";

export async function POST(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = enrollmentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getDb();
  const [classRow] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(eq(classes.id, parsed.data.classId))
    .limit(1);

  if (!classRow) {
    return NextResponse.json({ error: "Turma não encontrada." }, { status: 404 });
  }

  const [student] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, parsed.data.studentId))
    .limit(1);

  if (!student || student.role !== "aluno") {
    return NextResponse.json({ error: "Aluno inválido." }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.classId, parsed.data.classId),
        eq(enrollments.studentId, parsed.data.studentId),
      ),
    )
    .limit(1);

  if (existing) {
    return NextResponse.json({ enrollment: existing }, { status: 200 });
  }

  const [enrollment] = await db
    .insert(enrollments)
    .values({
      classId: parsed.data.classId,
      studentId: parsed.data.studentId,
    })
    .returning();

  return NextResponse.json({ enrollment }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = enrollmentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getDb();
  await db
    .delete(enrollments)
    .where(
      and(
        eq(enrollments.classId, parsed.data.classId),
        eq(enrollments.studentId, parsed.data.studentId),
      ),
    );

  return NextResponse.json({ ok: true });
}
