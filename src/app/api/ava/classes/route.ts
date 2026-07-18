import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { NextResponse } from "next/server";

import { requireRole, requireSession } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import {
  classes,
  enrollments,
  subjects,
  users,
} from "@/lib/ava/schema";
import { classCreateSchema } from "@/lib/ava/schemas";
import { isShiftAllowedForSubject } from "@/lib/ava/shifts";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const db = getDb();
  const teacher = alias(users, "teacher");

  if (session.user.role === "admin") {
    const rows = await db
      .select({
        id: classes.id,
        name: classes.name,
        shift: classes.shift,
        subjectId: classes.subjectId,
        subjectName: subjects.name,
        teacherId: classes.teacherId,
        teacherName: teacher.name,
        createdAt: classes.createdAt,
      })
      .from(classes)
      .innerJoin(subjects, eq(subjects.id, classes.subjectId))
      .leftJoin(teacher, eq(teacher.id, classes.teacherId))
      .orderBy(asc(subjects.name), asc(classes.name));

    return NextResponse.json({ classes: rows });
  }

  if (session.user.role === "professor") {
    const rows = await db
      .select({
        id: classes.id,
        name: classes.name,
        shift: classes.shift,
        subjectId: classes.subjectId,
        subjectName: subjects.name,
        teacherId: classes.teacherId,
        teacherName: teacher.name,
        createdAt: classes.createdAt,
      })
      .from(classes)
      .innerJoin(subjects, eq(subjects.id, classes.subjectId))
      .leftJoin(teacher, eq(teacher.id, classes.teacherId))
      .where(eq(classes.teacherId, session.user.id))
      .orderBy(asc(subjects.name), asc(classes.name));

    return NextResponse.json({ classes: rows });
  }

  const rows = await db
    .select({
      id: classes.id,
      name: classes.name,
      shift: classes.shift,
      subjectId: classes.subjectId,
      subjectName: subjects.name,
      teacherId: classes.teacherId,
      teacherName: teacher.name,
      createdAt: classes.createdAt,
    })
    .from(enrollments)
    .innerJoin(classes, eq(classes.id, enrollments.classId))
    .innerJoin(subjects, eq(subjects.id, classes.subjectId))
    .leftJoin(teacher, eq(teacher.id, classes.teacherId))
    .where(eq(enrollments.studentId, session.user.id))
    .orderBy(asc(subjects.name), asc(classes.name));

  return NextResponse.json({ classes: rows });
}

export async function POST(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = classCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getDb();
  const [subject] = await db
    .select({ id: subjects.id, name: subjects.name })
    .from(subjects)
    .where(eq(subjects.id, parsed.data.subjectId))
    .limit(1);

  if (!subject) {
    return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });
  }

  if (!isShiftAllowedForSubject(subject.name, parsed.data.shift)) {
    return NextResponse.json(
      { error: "Turno inválido para esta matéria." },
      { status: 400 },
    );
  }

  if (parsed.data.teacherId) {
    const [teacher] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, parsed.data.teacherId))
      .limit(1);

    if (!teacher || (teacher.role !== "professor" && teacher.role !== "admin")) {
      return NextResponse.json(
        { error: "Professor inválido." },
        { status: 400 },
      );
    }
  }

  const [classRow] = await db
    .insert(classes)
    .values({
      subjectId: parsed.data.subjectId,
      name: parsed.data.name,
      shift: parsed.data.shift,
      teacherId: parsed.data.teacherId ?? null,
    })
    .returning();

  return NextResponse.json({ class: classRow }, { status: 201 });
}
