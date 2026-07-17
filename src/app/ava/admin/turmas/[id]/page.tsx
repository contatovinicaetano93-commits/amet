import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { ClassManagePanel } from "@/components/ava/ClassManagePanel";
import { auth } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { canManageClass } from "@/lib/ava/permissions";
import {
  classes,
  enrollments,
  lessonProgress,
  lessons,
  subjects,
  users,
} from "@/lib/ava/schema";
import { asc } from "drizzle-orm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminClassPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/ava/login");
  if (session.user.role !== "admin" && session.user.role !== "professor") {
    redirect("/ava");
  }

  const { id } = await params;
  let row:
    | {
        id: string;
        name: string;
        subjectName: string;
        teacherId: string | null;
      }
    | undefined;

  try {
    const db = getDb();
    const [found] = await db
      .select({
        id: classes.id,
        name: classes.name,
        subjectName: subjects.name,
        teacherId: classes.teacherId,
      })
      .from(classes)
      .innerJoin(subjects, eq(subjects.id, classes.subjectId))
      .where(eq(classes.id, id))
      .limit(1);
    row = found;
  } catch (error) {
    console.error("[ava-admin-turma]", error);
    notFound();
  }

  if (!row) notFound();

  if (
    !canManageClass(session.user.role, row.teacherId, session.user.id)
  ) {
    redirect("/ava");
  }

  const db = getDb();
  const lessonRows = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      description: lessons.description,
      order: lessons.order,
      storageKey: lessons.storageKey,
      published: lessons.published,
    })
    .from(lessons)
    .where(eq(lessons.classId, id))
    .orderBy(asc(lessons.order), asc(lessons.createdAt));

  const studentRows = await db
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
    })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
    .where(eq(lessons.classId, id));

  const completedSet = new Set(
    progressRows.map((item) => `${item.userId}:${item.lessonId}`),
  );

  return (
    <ClassManagePanel
      classId={row.id}
      className={row.name}
      subjectName={row.subjectName}
      initialLessons={lessonRows.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        hasVideo: Boolean(lesson.storageKey),
        published: lesson.published === 1,
      }))}
      initialStudents={studentRows}
      initialProgress={studentRows.map((student) => ({
        ...student,
        completedLessonIds: lessonRows
          .filter((lesson) => completedSet.has(`${student.id}:${lesson.id}`))
          .map((lesson) => lesson.id),
      }))}
    />
  );
}
