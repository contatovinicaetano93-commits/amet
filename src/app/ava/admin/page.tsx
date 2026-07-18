import { and, asc, count, desc, eq, isNotNull, isNull, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { redirect } from "next/navigation";

import { AdminOnboarding } from "@/components/ava/AdminOnboarding";
import { AdminPanel } from "@/components/ava/AdminPanel";
import { auth } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { inviteEmailCanDeliverBroadly } from "@/lib/ava/invite-email";
import {
  classes,
  enrollments,
  invites,
  lessons,
  subjects,
  users,
} from "@/lib/ava/schema";
import { isR2Configured, missingR2EnvKeys } from "@/lib/ava/storage";

export default async function AvaAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/ava/login");
  if (session.user.role !== "admin") redirect("/ava");

  const db = getDb();
  const teacher = alias(users, "teacher");

  const [
    userRows,
    inviteRows,
    subjectRows,
    classRows,
    [enrollmentStats],
    [publishedStats],
    [pendingInviteStats],
    [nonBootstrapUsers],
  ] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .orderBy(asc(users.name)),
    db
      .select({
        id: invites.id,
        email: invites.email,
        role: invites.role,
        expiresAt: invites.expiresAt,
        usedAt: invites.usedAt,
      })
      .from(invites)
      .orderBy(desc(invites.createdAt)),
    db.select().from(subjects).orderBy(asc(subjects.name)),
    db
      .select({
        id: classes.id,
        name: classes.name,
        shift: classes.shift,
        subjectId: classes.subjectId,
        subjectName: subjects.name,
        teacherId: classes.teacherId,
        teacherName: teacher.name,
      })
      .from(classes)
      .innerJoin(subjects, eq(subjects.id, classes.subjectId))
      .leftJoin(teacher, eq(teacher.id, classes.teacherId))
      .orderBy(asc(subjects.name), asc(classes.name)),
    db.select({ value: count() }).from(enrollments),
    db
      .select({ value: count() })
      .from(lessons)
      .where(and(eq(lessons.published, 1), isNotNull(lessons.storageKey))),
    db
      .select({ value: count() })
      .from(invites)
      .where(isNull(invites.usedAt)),
    db
      .select({ value: count() })
      .from(users)
      .where(ne(users.email, session.user.email ?? "")),
  ]);

  const firstClassId = classRows[0]?.id ?? null;

  return (
    <div className="space-y-10">
      <div className="ava-fade-in space-y-4">
        <p className="ava-kicker">Administração</p>
        <h1 className="ava-display text-4xl text-amet-indigo sm:text-5xl">
          Painel AVA
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-[var(--ava-muted)]">
          Convite → matéria → turma → matrícula → gerir aulas.
        </p>
      </div>

      <AdminOnboarding
        invitedOrExtraUsers={
          (nonBootstrapUsers?.value ?? 0) > 0 ||
          (pendingInviteStats?.value ?? 0) > 0
        }
        subjectsCount={subjectRows.length}
        classesCount={classRows.length}
        enrollmentsCount={enrollmentStats?.value ?? 0}
        publishedLessonsCount={publishedStats?.value ?? 0}
        firstClassId={firstClassId}
      />

      <AdminPanel
        initialUsers={userRows}
        initialInvites={inviteRows.map((invite) => ({
          ...invite,
          expiresAt: invite.expiresAt.toISOString(),
          usedAt: invite.usedAt ? invite.usedAt.toISOString() : null,
        }))}
        initialSubjects={subjectRows}
        initialClasses={classRows}
        storageConfigured={isR2Configured()}
        missingStorageKeys={missingR2EnvKeys()}
        emailConfigured={inviteEmailCanDeliverBroadly()}
      />
    </div>
  );
}
