import { and, count, desc, eq, isNull } from "drizzle-orm";

import { getDb } from "@/lib/ava/db";
import {
  classes,
  enrollments,
  invites,
  lessonQuestions,
  lessons,
  subjects,
  users,
} from "@/lib/ava/schema";

export type OpenDoubt = {
  id: string;
  body: string;
  createdAt: Date;
  askerName: string;
  lessonId: string;
  lessonTitle: string;
  classId: string;
  className: string;
  subjectName: string;
};

export type OpsSnapshot = {
  professors: number;
  students: number;
  classes: number;
  classesWithoutTeacher: number;
  enrollments: number;
  publishedLessons: number;
  pendingInvites: number;
  openDoubts: number;
};

export async function listOpenDoubts(options?: {
  teacherId?: string;
  limit?: number;
}): Promise<OpenDoubt[]> {
  const db = getDb();
  const limit = options?.limit ?? 50;

  const condition = options?.teacherId
    ? and(
        isNull(lessonQuestions.answer),
        eq(classes.teacherId, options.teacherId),
      )
    : isNull(lessonQuestions.answer);

  const rows = await db
    .select({
      id: lessonQuestions.id,
      body: lessonQuestions.body,
      createdAt: lessonQuestions.createdAt,
      askerName: users.name,
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      classId: classes.id,
      className: classes.name,
      subjectName: subjects.name,
    })
    .from(lessonQuestions)
    .innerJoin(lessons, eq(lessons.id, lessonQuestions.lessonId))
    .innerJoin(classes, eq(classes.id, lessons.classId))
    .innerJoin(subjects, eq(subjects.id, classes.subjectId))
    .innerJoin(users, eq(users.id, lessonQuestions.askerId))
    .where(condition)
    .orderBy(desc(lessonQuestions.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt,
    askerName: row.askerName,
    lessonId: row.lessonId,
    lessonTitle: row.lessonTitle,
    classId: row.classId,
    className: row.className,
    subjectName: row.subjectName,
  }));
}

export async function getOpsSnapshot(): Promise<OpsSnapshot> {
  const db = getDb();

  const [
    [professorStats],
    [studentStats],
    [classStats],
    [noTeacherStats],
    [enrollmentStats],
    [publishedStats],
    [pendingInviteStats],
    [openDoubtStats],
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(users)
      .where(eq(users.role, "professor")),
    db
      .select({ value: count() })
      .from(users)
      .where(eq(users.role, "aluno")),
    db.select({ value: count() }).from(classes),
    db
      .select({ value: count() })
      .from(classes)
      .where(isNull(classes.teacherId)),
    db.select({ value: count() }).from(enrollments),
    db
      .select({ value: count() })
      .from(lessons)
      .where(eq(lessons.published, 1)),
    db
      .select({ value: count() })
      .from(invites)
      .where(isNull(invites.usedAt)),
    db
      .select({ value: count() })
      .from(lessonQuestions)
      .where(isNull(lessonQuestions.answer)),
  ]);

  return {
    professors: professorStats?.value ?? 0,
    students: studentStats?.value ?? 0,
    classes: classStats?.value ?? 0,
    classesWithoutTeacher: noTeacherStats?.value ?? 0,
    enrollments: enrollmentStats?.value ?? 0,
    publishedLessons: publishedStats?.value ?? 0,
    pendingInvites: pendingInviteStats?.value ?? 0,
    openDoubts: openDoubtStats?.value ?? 0,
  };
}
