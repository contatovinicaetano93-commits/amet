import { and, asc, count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { ProfessorPanel } from "@/components/ava/ProfessorPanel";
import { auth } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { homePathForRole } from "@/lib/ava/navigation";
import { avaLog, errorMessage } from "@/lib/ava/observability";
import { listOpenDoubts, type OpenDoubt } from "@/lib/ava/ops";
import { classes, enrollments, lessons, subjects } from "@/lib/ava/schema";

export default async function ProfessorPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/ava/login");
  }
  if (session.user.role !== "professor" && session.user.role !== "admin") {
    redirect(homePathForRole(session.user.role));
  }
  if (session.user.role === "admin") {
    redirect("/ava/admin");
  }

  let classRows: Array<{
    id: string;
    name: string;
    shift: string | null;
    subjectName: string;
    lessonCount: number;
    publishedCount: number;
    studentCount: number;
  }> = [];
  let openDoubts: OpenDoubt[] = [];

  try {
    const db = getDb();
    const owned = await db
      .select({
        id: classes.id,
        name: classes.name,
        shift: classes.shift,
        subjectName: subjects.name,
      })
      .from(classes)
      .innerJoin(subjects, eq(subjects.id, classes.subjectId))
      .where(eq(classes.teacherId, session.user.id))
      .orderBy(asc(subjects.name), asc(classes.name));

    classRows = await Promise.all(
      owned.map(async (row) => {
        const [lessonStats] = await db
          .select({ value: count() })
          .from(lessons)
          .where(eq(lessons.classId, row.id));
        const [publishedStats] = await db
          .select({ value: count() })
          .from(lessons)
          .where(
            and(eq(lessons.classId, row.id), eq(lessons.published, 1)),
          );
        const [studentStats] = await db
          .select({ value: count() })
          .from(enrollments)
          .where(eq(enrollments.classId, row.id));
        return {
          ...row,
          lessonCount: lessonStats?.value ?? 0,
          publishedCount: publishedStats?.value ?? 0,
          studentCount: studentStats?.value ?? 0,
        };
      }),
    );

    openDoubts = await listOpenDoubts({
      teacherId: session.user.id,
      limit: 30,
    });
  } catch (error) {
    avaLog.error("professor.panel_load_failed", {
      message: errorMessage(error),
    });
  }

  return (
    <ProfessorPanel
      teacherName={session.user.name ?? "Professor(a)"}
      classes={classRows}
      openDoubts={openDoubts}
    />
  );
}
