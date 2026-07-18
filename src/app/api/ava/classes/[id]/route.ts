import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { NextResponse } from "next/server";

import { userCanAccessClass } from "@/lib/ava/access";
import { requireRole, requireSession } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { canManageClass } from "@/lib/ava/permissions";
import {
  classes,
  enrollments,
  lessons,
  subjects,
  users,
} from "@/lib/ava/schema";
import { classUpdateSchema } from "@/lib/ava/schemas";
import { isShiftAllowedForSubject } from "@/lib/ava/shifts";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const access = await userCanAccessClass({
    userId: session.user.id,
    role: session.user.role,
    classId: id,
  });

  if (!access.allowed || !access.classRow) {
    return NextResponse.json({ error: "Turma não encontrada." }, { status: 404 });
  }

  const db = getDb();
  const teacher = alias(users, "teacher");

  const [detail] = await db
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
    .where(eq(classes.id, id))
    .limit(1);

  const lessonRows = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      description: lessons.description,
      order: lessons.order,
      storageKey: lessons.storageKey,
      published: lessons.published,
      contentType: lessons.contentType,
      sizeBytes: lessons.sizeBytes,
    })
    .from(lessons)
    .where(eq(lessons.classId, id))
    .orderBy(asc(lessons.order), asc(lessons.createdAt));

  const canManage = canManageClass(
    session.user.role,
    access.classRow.teacherId,
    session.user.id,
  );

  const visibleLessons = canManage
    ? lessonRows
    : lessonRows.filter((lesson) => lesson.published === 1 && lesson.storageKey);

  let students: Array<{
    id: string;
    name: string;
    email: string;
  }> = [];

  if (canManage || session.user.role === "admin") {
    students = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(enrollments)
      .innerJoin(users, eq(users.id, enrollments.studentId))
      .where(eq(enrollments.classId, id));
  }

  return NextResponse.json({
    class: detail,
    lessons: visibleLessons.map(({ storageKey, ...lesson }) => ({
      ...lesson,
      hasVideo: Boolean(storageKey),
      published: lesson.published === 1,
    })),
    students,
    canManage,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = classUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getDb();
  const [existing] = await db
    .select({
      id: classes.id,
      name: classes.name,
      shift: classes.shift,
      teacherId: classes.teacherId,
      subjectName: subjects.name,
    })
    .from(classes)
    .innerJoin(subjects, eq(subjects.id, classes.subjectId))
    .where(eq(classes.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Turma não encontrada." }, { status: 404 });
  }

  if (
    parsed.data.shift &&
    !isShiftAllowedForSubject(existing.subjectName, parsed.data.shift)
  ) {
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
      return NextResponse.json({ error: "Professor inválido." }, { status: 400 });
    }
  }

  const [updated] = await db
    .update(classes)
    .set({
      name: parsed.data.name ?? existing.name,
      shift: parsed.data.shift ?? existing.shift,
      teacherId:
        parsed.data.teacherId === undefined
          ? existing.teacherId
          : parsed.data.teacherId,
    })
    .where(eq(classes.id, id))
    .returning();

  return NextResponse.json({ class: updated });
}
