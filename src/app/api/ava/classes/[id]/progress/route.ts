import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { userCanAccessClass } from "@/lib/ava/access";
import { requireSession } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { canManageClass } from "@/lib/ava/permissions";
import {
  enrollments,
  lessonProgress,
  lessons,
  users,
} from "@/lib/ava/schema";

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
  const classLessons = await db
    .select({ id: lessons.id, title: lessons.title, order: lessons.order })
    .from(lessons)
    .where(eq(lessons.classId, id));

  const students = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(enrollments)
    .innerJoin(users, eq(users.id, enrollments.studentId))
    .where(eq(enrollments.classId, id));

  const progressRows = await db
    .select({
      userId: lessonProgress.userId,
      lessonId: lessonProgress.lessonId,
      completedAt: lessonProgress.completedAt,
    })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
    .where(eq(lessons.classId, id));

  const completedSet = new Set(
    progressRows.map((row) => `${row.userId}:${row.lessonId}`),
  );

  return NextResponse.json({
    lessons: classLessons,
    students: students.map((student) => ({
      ...student,
      completedLessonIds: classLessons
        .filter((lesson) => completedSet.has(`${student.id}:${lesson.id}`))
        .map((lesson) => lesson.id),
    })),
  });
}
