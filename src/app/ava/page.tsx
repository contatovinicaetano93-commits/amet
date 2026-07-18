import { asc, count, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminOnboarding } from "@/components/ava/AdminOnboarding";
import { auth } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { avaLog, errorMessage } from "@/lib/ava/observability";
import { roleLabel } from "@/lib/ava/permissions";
import {
  classes,
  enrollments,
  invites,
  subjects,
  users,
} from "@/lib/ava/schema";

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
  let loadError = false;
  let subjectsCount = 0;
  let classesCount = 0;
  let usersCount = 0;
  let invitesPendingCount = 0;

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

      const [subjectStats] = await db.select({ value: count() }).from(subjects);
      const [classStats] = await db.select({ value: count() }).from(classes);
      const [userStats] = await db.select({ value: count() }).from(users);
      const [inviteStats] = await db
        .select({ value: count() })
        .from(invites)
        .where(isNull(invites.usedAt));

      subjectsCount = subjectStats?.value ?? 0;
      classesCount = classStats?.value ?? 0;
      usersCount = userStats?.value ?? 0;
      invitesPendingCount = inviteStats?.value ?? 0;
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
    loadError = true;
    avaLog.error("home.load_failed", { message: errorMessage(error) });
  }

  const emptyCopy =
    session.user.role === "admin"
      ? {
          title: "Nenhuma turma ainda",
          body: "Use o checklist abaixo e o painel admin para criar matéria, turma e convidar pessoas.",
          cta: { href: "/ava/admin", label: "Abrir painel admin" },
        }
      : session.user.role === "professor"
        ? {
            title: "Você ainda não tem turmas",
            body: "Peça ao administrador para criar uma turma e atribuir você como professor. Depois ela aparece aqui para publicar aulas.",
            cta: null,
          }
        : {
            title: "Nenhuma turma matriculada",
            body: "Assim que o admin te matricular, suas turmas e vídeo-aulas aparecem neste espaço.",
            cta: null,
          };

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

      {session.user.role === "admin" ? (
        <AdminOnboarding
          subjectsCount={subjectsCount}
          classesCount={classesCount}
          usersCount={usersCount}
          invitesPendingCount={invitesPendingCount}
        />
      ) : null}

      {loadError ? (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Não foi possível carregar suas turmas agora. Atualize a página em
          instantes.
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-amet-indigo">Suas turmas</h2>
        {classRows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-amet-indigo/20 bg-white/70 px-5 py-8">
            <h3 className="text-lg font-semibold text-amet-indigo">
              {emptyCopy.title}
            </h3>
            <p className="mt-2 max-w-xl text-amet-indigo/70">{emptyCopy.body}</p>
            {emptyCopy.cta ? (
              <Link
                href={emptyCopy.cta.href}
                className="mt-4 inline-flex rounded-md border border-amet-indigo/15 px-3 py-2 text-sm font-medium text-amet-indigo hover:bg-white"
              >
                {emptyCopy.cta.label}
              </Link>
            ) : null}
          </div>
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
