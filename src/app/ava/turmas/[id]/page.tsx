import { and, asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { userCanAccessClass } from "@/lib/ava/access";
import { auth } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { classManagePath, homePathForRole } from "@/lib/ava/navigation";
import { canManageClass } from "@/lib/ava/permissions";
import {
  classes,
  lessonProgress,
  lessons,
  subjects,
  users,
} from "@/lib/ava/schema";
import { shiftDetail } from "@/lib/ava/shifts";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClassPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/ava/login");

  const { id } = await params;
  const access = await userCanAccessClass({
    userId: session.user.id,
    role: session.user.role,
    classId: id,
  });

  if (!access.allowed || !access.classRow) {
    notFound();
  }

  const db = getDb();
  const teacher = alias(users, "teacher");
  const [detail] = await db
    .select({
      id: classes.id,
      name: classes.name,
      shift: classes.shift,
      subjectName: subjects.name,
      teacherName: teacher.name,
      teacherId: classes.teacherId,
    })
    .from(classes)
    .innerJoin(subjects, eq(subjects.id, classes.subjectId))
    .leftJoin(teacher, eq(teacher.id, classes.teacherId))
    .where(eq(classes.id, id))
    .limit(1);

  if (!detail) notFound();

  const manage = canManageClass(
    session.user.role,
    detail.teacherId,
    session.user.id,
  );

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

  const visible = manage
    ? lessonRows
    : lessonRows.filter((lesson) => lesson.published === 1 && lesson.storageKey);

  const progress = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, session.user.id)));

  const completed = new Set(progress.map((row) => row.lessonId));
  const doneCount = visible.filter((lesson) => completed.has(lesson.id)).length;

  return (
    <div className="space-y-10">
      <section className="ava-fade-in space-y-4">
        <p className="ava-kicker">{detail.subjectName}</p>
        <h1 className="ava-display text-4xl text-amet-indigo sm:text-5xl">
          {detail.name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--ava-muted)]">
          {shiftDetail(detail.shift) ? (
            <span>{shiftDetail(detail.shift)}</span>
          ) : null}
          {detail.teacherName ? <span>Prof. {detail.teacherName}</span> : null}
          {visible.length > 0 ? (
            <span>
              {doneCount}/{visible.length} aulas concluídas
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-4 pt-1">
          <Link href={homePathForRole(session.user.role)} className="ava-link text-sm">
            ← Voltar
          </Link>
          {manage ? (
            <Link href={classManagePath(id)} className="ava-link text-sm">
              Gerir aulas e progresso
            </Link>
          ) : null}
        </div>
      </section>

      <section className="ava-fade-in-delay space-y-5">
        <div className="space-y-1">
          <p className="ava-kicker">Programa</p>
          <h2 className="text-2xl font-semibold tracking-tight text-amet-indigo">
            Aulas
          </h2>
        </div>

        {visible.length === 0 ? (
          <p className="ava-panel text-[var(--ava-muted)]">
            Nenhuma aula publicada nesta turma.
          </p>
        ) : (
          <ul>
            {visible.map((lesson) => {
              const done = completed.has(lesson.id);
              return (
                <li key={lesson.id}>
                  <Link
                    href={`/ava/turmas/${id}/aulas/${lesson.id}`}
                    className="ava-row"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ava-muted)]">
                          Aula {String(lesson.order + 1).padStart(2, "0")}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold tracking-tight text-amet-indigo">
                          {lesson.title}
                        </h3>
                        {lesson.description ? (
                          <p className="mt-1 line-clamp-2 text-sm text-[var(--ava-muted)]">
                            {lesson.description}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={`shrink-0 pt-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                          done ? "text-emerald-800" : "text-[var(--ava-muted)]"
                        }`}
                      >
                        {done ? "Concluída" : "Pendente"}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
