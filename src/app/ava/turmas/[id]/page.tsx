import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { userCanAccessClass } from "@/lib/ava/access";
import { auth } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { canManageClass } from "@/lib/ava/permissions";
import {
  classes,
  lessonProgress,
  lessons,
  subjects,
  users,
} from "@/lib/ava/schema";
import { alias } from "drizzle-orm/pg-core";

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
    .where(
      and(
        eq(lessonProgress.userId, session.user.id),
      ),
    );

  const completed = new Set(progress.map((row) => row.lessonId));

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-amet-purple">
          {detail.subjectName}
        </p>
        <h1 className="text-3xl font-semibold text-amet-indigo">{detail.name}</h1>
        {detail.teacherName ? (
          <p className="text-amet-indigo/70">Prof. {detail.teacherName}</p>
        ) : null}
        <div className="flex flex-wrap gap-3 pt-1">
          <Link href="/ava" className="text-sm text-amet-blue hover:underline">
            ← Voltar
          </Link>
          {manage ? (
            <Link
              href={`/ava/admin/turmas/${id}`}
              className="text-sm text-amet-blue hover:underline"
            >
              Gerir aulas e progresso
            </Link>
          ) : null}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Aulas</h2>
        {visible.length === 0 ? (
          <p className="rounded-lg border border-dashed border-amet-indigo/20 bg-white/70 px-4 py-8 text-amet-indigo/70">
            Nenhuma aula publicada nesta turma.
          </p>
        ) : (
          <ul className="space-y-3">
            {visible.map((lesson) => {
              const done = completed.has(lesson.id);
              return (
                <li key={lesson.id}>
                  <Link
                    href={`/ava/turmas/${id}/aulas/${lesson.id}`}
                    className="flex items-start justify-between gap-4 rounded-lg border border-amet-indigo/10 bg-white/90 p-4 transition hover:border-amet-blue/30"
                  >
                    <div>
                      <h3 className="font-semibold text-amet-indigo">
                        {lesson.order + 1}. {lesson.title}
                      </h3>
                      {lesson.description ? (
                        <p className="mt-1 text-sm text-amet-indigo/65">
                          {lesson.description}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${
                        done
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amet-indigo/5 text-amet-indigo/70"
                      }`}
                    >
                      {done ? "Concluída" : "Pendente"}
                    </span>
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
