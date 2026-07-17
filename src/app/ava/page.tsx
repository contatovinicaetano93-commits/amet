import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { roleLabel } from "@/lib/ava/permissions";
import { classes, enrollments, subjects, users } from "@/lib/ava/schema";
import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export default async function AvaHomePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/ava/login");
  }

  let classRows: Array<{
    id: string;
    name: string;
    subjectName: string;
    teacherName: string | null;
  }> = [];

  try {
    const db = getDb();
    const teacher = alias(users, "teacher");

    if (session.user.role === "admin") {
      classRows = await db
        .select({
          id: classes.id,
          name: classes.name,
          subjectName: subjects.name,
          teacherName: teacher.name,
        })
        .from(classes)
        .innerJoin(subjects, eq(subjects.id, classes.subjectId))
        .leftJoin(teacher, eq(teacher.id, classes.teacherId))
        .orderBy(asc(subjects.name), asc(classes.name));
    } else if (session.user.role === "professor") {
      classRows = await db
        .select({
          id: classes.id,
          name: classes.name,
          subjectName: subjects.name,
          teacherName: teacher.name,
        })
        .from(classes)
        .innerJoin(subjects, eq(subjects.id, classes.subjectId))
        .leftJoin(teacher, eq(teacher.id, classes.teacherId))
        .where(eq(classes.teacherId, session.user.id))
        .orderBy(asc(subjects.name), asc(classes.name));
    } else {
      classRows = await db
        .select({
          id: classes.id,
          name: classes.name,
          subjectName: subjects.name,
          teacherName: teacher.name,
        })
        .from(enrollments)
        .innerJoin(classes, eq(classes.id, enrollments.classId))
        .innerJoin(subjects, eq(subjects.id, classes.subjectId))
        .leftJoin(teacher, eq(teacher.id, classes.teacherId))
        .where(eq(enrollments.studentId, session.user.id))
        .orderBy(asc(subjects.name), asc(classes.name));
    }
  } catch (error) {
    console.error("[ava-home] falha ao carregar turmas:", error);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-amet-purple">
          Ambiente Virtual
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-amet-indigo sm:text-4xl">
          Olá, {session.user.name?.split(" ")[0] ?? "bem-vindo(a)"}
        </h1>
        <p className="max-w-2xl text-amet-indigo/70">
          Você está conectado como {roleLabel(session.user.role)}. Acesse suas
          turmas e acompanhe as vídeo-aulas.
        </p>
        {session.user.role === "admin" ? (
          <Link
            href="/ava/admin"
            className="inline-flex rounded-md bg-amet-indigo px-4 py-2 text-sm font-semibold text-white transition hover:bg-amet-blue"
          >
            Abrir painel admin
          </Link>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-amet-indigo">Suas turmas</h2>
        {classRows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-amet-indigo/20 bg-white/70 px-4 py-8 text-amet-indigo/70">
            Nenhuma turma disponível ainda.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {classRows.map((classRow) => (
              <li key={classRow.id}>
                <Link
                  href={`/ava/turmas/${classRow.id}`}
                  className="block rounded-lg border border-amet-indigo/10 bg-white/90 p-5 transition hover:-translate-y-0.5 hover:border-amet-blue/30 hover:shadow-[0_18px_40px_-30px_rgba(28,36,147,0.55)]"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-amet-purple">
                    {classRow.subjectName}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-amet-indigo">
                    {classRow.name}
                  </h3>
                  {classRow.teacherName ? (
                    <p className="mt-2 text-sm text-amet-indigo/60">
                      Prof. {classRow.teacherName}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
