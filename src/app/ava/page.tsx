import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FlowTree } from "@/components/ava/FlowTree";
import { auth } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { buildStudentFlow } from "@/lib/ava/flows";
import { homePathForRole } from "@/lib/ava/navigation";
import { avaLog, errorMessage } from "@/lib/ava/observability";
import { classes, enrollments, subjects, users } from "@/lib/ava/schema";
import { shiftDetail } from "@/lib/ava/shifts";

export default async function AvaHomePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/ava/login");
  }

  if (session.user.role !== "aluno") {
    redirect(homePathForRole(session.user.role));
  }

  let classRows: Array<{
    id: string;
    name: string;
    shift: string | null;
    subjectName: string;
    teacherName: string | null;
  }> = [];
  let loadError = false;

  try {
    const db = getDb();
    const teacher = alias(users, "teacher");
    classRows = await db
      .select({
        id: classes.id,
        name: classes.name,
        shift: classes.shift,
        subjectName: subjects.name,
        teacherName: teacher.name,
      })
      .from(enrollments)
      .innerJoin(classes, eq(classes.id, enrollments.classId))
      .innerJoin(subjects, eq(subjects.id, classes.subjectId))
      .leftJoin(teacher, eq(teacher.id, classes.teacherId))
      .where(eq(enrollments.studentId, session.user.id))
      .orderBy(asc(subjects.name), asc(classes.name));
  } catch (error) {
    loadError = true;
    avaLog.error("home.load_failed", { message: errorMessage(error) });
  }

  const tree = buildStudentFlow({
    classesCount: classRows.length,
    hasOpenClass: classRows.length > 0,
  });

  const firstName = session.user.name?.split(" ")[0] ?? "bem-vindo(a)";

  return (
    <div className="space-y-12">
      <section className="ava-fade-in space-y-4">
        <p className="ava-kicker">Seu espaço de estudo</p>
        <h1 className="ava-display text-4xl text-amet-indigo sm:text-5xl">
          Olá, {firstName}
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-[var(--ava-muted)]">
          Continue pelas turmas matriculadas. Assista, acompanhe o progresso e
          tire dúvidas com o professor.
        </p>
      </section>

      <div className="ava-fade-in-delay">
        <FlowTree tree={tree} compact />
      </div>

      {loadError ? (
        <p className="border-l-2 border-amber-700/50 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          Não foi possível carregar suas turmas agora. Atualize a página em
          instantes.
        </p>
      ) : null}

      <section className="ava-fade-in-delay-2 space-y-5">
        <div className="space-y-1">
          <p className="ava-kicker">Matrículas</p>
          <h2 className="text-2xl font-semibold tracking-tight text-amet-indigo">
            Suas turmas
          </h2>
        </div>

        {classRows.length === 0 ? (
          <div className="ava-panel">
            <h3 className="text-lg font-semibold text-amet-indigo">
              Nenhuma turma ainda
            </h3>
            <p className="mt-2 max-w-xl text-[var(--ava-muted)]">
              Assim que o admin te matricular, as turmas e vídeo-aulas aparecem
              aqui.
            </p>
          </div>
        ) : (
          <ul>
            {classRows.map((classRow) => (
              <li key={classRow.id}>
                <Link href={`/ava/turmas/${classRow.id}`} className="ava-row">
                  <p className="ava-kicker">{classRow.subjectName}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-amet-indigo">
                    {classRow.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ava-muted)]">
                    {[
                      shiftDetail(classRow.shift),
                      classRow.teacherName
                        ? `Prof. ${classRow.teacherName}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
